import { Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ChildrenService } from '../children/children.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateDiaperDto } from './dto/create-diaper.dto';

type DiaperRow = {
  id: string;
  child_id: string;
  logged_by_firebase_uid: string;
  occurred_at: string;
  type: 'wet' | 'dry' | 'both';
  notes: string | null;
};

@Injectable()
export class DiapersService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly childrenService: ChildrenService,
  ) {}

  async listDiapersForChild(childId: string, user: DecodedIdToken) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('diapers')
      .select('id, child_id, logged_by_firebase_uid, occurred_at, type, notes')
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false })
      .returns<DiaperRow[]>();

    if (error) {
      throw new Error(`Unable to fetch diaper logs: ${error.message}`);
    }

    return (data ?? []).map((diaper) => this.mapDiaper(diaper));
  }

  async createDiaper(
    childId: string,
    user: DecodedIdToken,
    dto: CreateDiaperDto,
  ) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('diapers')
      .insert({
        child_id: childId,
        logged_by_firebase_uid: user.uid,
        occurred_at: dto.timestamp,
        type: dto.type,
        notes: dto.notes?.trim() || null,
      })
      .select('id, child_id, logged_by_firebase_uid, occurred_at, type, notes')
      .single<DiaperRow>();

    if (error || !data) {
      throw new Error(
        `Unable to create diaper log: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapDiaper(data);
  }

  private mapDiaper(diaper: DiaperRow) {
    return {
      id: diaper.id,
      childId: diaper.child_id,
      timestamp: diaper.occurred_at,
      type: diaper.type,
      notes: diaper.notes ?? undefined,
      loggedBy: diaper.logged_by_firebase_uid,
    };
  }
}
