import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateChildDto } from './dto/create-child.dto';
import { UpdateChildDto } from './dto/update-child.dto';

type ChildRow = {
  id: string;
  name: string;
  birth_date: string;
  notes: string | null;
  photo_url: string | null;
  owner_firebase_uid: string;
};

type ChildCaregiverRow = {
  caregiver_firebase_uid: string;
  role: 'owner' | 'caregiver';
};

@Injectable()
export class ChildrenService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async listChildrenForUser(user: DecodedIdToken) {
    await this.ensureAppUser(user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('child_caregivers')
      .select(
        `
        caregiver_firebase_uid,
        role,
        child:children (
          id,
          name,
          birth_date,
          notes,
          photo_url,
          owner_firebase_uid
        )
      `,
      )
      .eq('caregiver_firebase_uid', user.uid);

    if (error) {
      throw new Error(`Unable to fetch children: ${error.message}`);
    }

    const childRows = (data ?? [])
      .map((entry) => {
        const child = entry.child;

        if (!child || Array.isArray(child)) {
          return null;
        }

        return child as ChildRow;
      })
      .filter((entry): entry is ChildRow => Boolean(entry));

    const uniqueChildren = Array.from(
      new Map(childRows.map((child) => [child.id, child])).values(),
    );

    return Promise.all(
      uniqueChildren.map((child) => this.getChildWithCaregivers(child.id)),
    );
  }

  async getChildForUser(childId: string, user: DecodedIdToken) {
    await this.ensureAppUser(user);
    await this.assertCaregiverAccess(childId, user.uid);
    return this.getChildWithCaregivers(childId);
  }

  async createChild(user: DecodedIdToken, dto: CreateChildDto) {
    await this.ensureAppUser(user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('children')
      .insert({
        owner_firebase_uid: user.uid,
        name: dto.name,
        birth_date: dto.birthDate,
        notes: dto.notes ?? null,
        photo_url: dto.photoUrl ?? null,
      })
      .select('id, name, birth_date, notes, photo_url, owner_firebase_uid')
      .single();

    if (error || !data) {
      throw new Error(`Unable to create child: ${error?.message ?? 'Unknown error'}`);
    }

    const { error: caregiverError } = await client.from('child_caregivers').insert({
      child_id: data.id,
      caregiver_firebase_uid: user.uid,
      role: 'owner',
    });

    if (caregiverError) {
      throw new Error(
        `Child created but caregiver membership failed: ${caregiverError.message}`,
      );
    }

    return this.getChildWithCaregivers(data.id);
  }

  async updateChild(childId: string, user: DecodedIdToken, dto: UpdateChildDto) {
    await this.ensureAppUser(user);
    await this.assertOwnerAccess(childId, user.uid);

    const client = this.supabaseService.getAdminClient();
    const { error } = await client
      .from('children')
      .update({
        name: dto.name,
        birth_date: dto.birthDate,
        notes: dto.notes,
        photo_url: dto.photoUrl,
      })
      .eq('id', childId);

    if (error) {
      throw new Error(`Unable to update child: ${error.message}`);
    }

    return this.getChildWithCaregivers(childId);
  }

  async deleteChild(childId: string, user: DecodedIdToken) {
    await this.ensureAppUser(user);
    await this.assertOwnerAccess(childId, user.uid);

    const client = this.supabaseService.getAdminClient();
    const { error } = await client.from('children').delete().eq('id', childId);

    if (error) {
      throw new Error(`Unable to delete child: ${error.message}`);
    }

    return {
      success: true,
      childId,
    };
  }

  private async ensureAppUser(user: DecodedIdToken) {
    const client = this.supabaseService.getAdminClient();

    const { error } = await client.from('app_users').upsert(
      {
        firebase_uid: user.uid,
        email: user.email ?? `${user.uid}@unknown.local`,
        display_name: user.name ?? null,
        photo_url: user.picture ?? null,
        role: 'parent',
      },
      {
        onConflict: 'firebase_uid', // make sure firebase_uid is unique, if exists -> update record, otherwise insert new data
      },
    );

    if (error) {
      throw new Error(`Unable to sync app user: ${error.message}`);
    }
  }

  private async assertCaregiverAccess(childId: string, firebaseUid: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('child_caregivers')
      .select('child_id')
      .eq('child_id', childId)
      .eq('caregiver_firebase_uid', firebaseUid)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to verify child access: ${error.message}`);
    }

    if (!data) {
      throw new ForbiddenException(
        'You do not have access to this child profile.',
      );
    }
  }

  private async assertOwnerAccess(childId: string, firebaseUid: string) {
    const child = await this.getChildRow(childId);

    if (child.owner_firebase_uid !== firebaseUid) {
      throw new ForbiddenException(
        'Only the owner can update or delete this child profile.',
      );
    }
  }

  private async getChildWithCaregivers(childId: string) {
    const child = await this.getChildRow(childId);
    const caregivers = await this.getCaregiverIds(childId);

    return {
      id: child.id,
      name: child.name,
      birthDate: child.birth_date,
      notes: child.notes ?? '',
      photo: child.photo_url ?? undefined,
      caregivers,
      ownerId: child.owner_firebase_uid,
    };
  }

  private async getChildRow(childId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('children')
      .select('id, name, birth_date, notes, photo_url, owner_firebase_uid')
      .eq('id', childId)
      .maybeSingle<ChildRow>();

    if (error) {
      throw new Error(`Unable to fetch child: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('Child profile not found.');
    }

    return data;
  }

  private async getCaregiverIds(childId: string) {
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('child_caregivers')
      .select('caregiver_firebase_uid, role')
      .eq('child_id', childId)
      .returns<ChildCaregiverRow[]>();

    if (error) {
      throw new Error(`Unable to fetch child caregivers: ${error.message}`);
    }

    return (data ?? []).map((entry) => entry.caregiver_firebase_uid);
  }
}
