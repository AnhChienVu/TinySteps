import { Injectable, NotFoundException } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ChildrenService } from '../children/children.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateInviteDto } from './dto/create-invite.dto';

type InviteRow = {
  id: string;
  child_id: string;
  inviter_firebase_uid: string;
  inviter_email: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
};

@Injectable()
export class InvitesService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly childrenService: ChildrenService,
  ) {}

  async listIncomingInvites(user: DecodedIdToken) {
    await this.ensureAppUser(user);

    if (!user.email) {
      return [];
    }

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('invites')
      .select(
        `
        id,
        child_id,
        inviter_firebase_uid,
        inviter_email,
        invitee_email,
        status,
        created_at,
        child:children (
          name
        )
      `,
      )
      .eq('invitee_email', user.email.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Unable to fetch incoming invites: ${error.message}`);
    }

    return (data ?? []).map((invite) => {
      return this.mapInvite(
        {
          id: invite.id,
          child_id: invite.child_id,
          inviter_firebase_uid: invite.inviter_firebase_uid,
          inviter_email: invite.inviter_email,
          invitee_email: invite.invitee_email,
          status: invite.status,
          created_at: invite.created_at,
        },
        this.getChildName(invite.child),
      );
    });
  }

  async listInvitesForChild(childId: string, user: DecodedIdToken) {
    const child = await this.childrenService.getChildForUser(childId, user);
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('invites')
      .select(
        'id, child_id, inviter_firebase_uid, inviter_email, invitee_email, status, created_at',
      )
      .eq('child_id', childId)
      .order('created_at', { ascending: false })
      .returns<InviteRow[]>();

    if (error) {
      throw new Error(`Unable to fetch invites: ${error.message}`);
    }

    return (data ?? []).map((invite) => this.mapInvite(invite, child.name));
  }

  async createInvite(
    childId: string,
    user: DecodedIdToken,
    dto: CreateInviteDto,
  ) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('invites')
      .insert({
        child_id: childId,
        inviter_firebase_uid: user.uid,
        inviter_email: user.email ?? `${user.uid}@unknown.local`,
        invitee_email: dto.inviteeEmail.trim().toLowerCase(),
      })
      .select(
        'id, child_id, inviter_firebase_uid, inviter_email, invitee_email, status, created_at',
      )
      .single<InviteRow>();

    if (error || !data) {
      throw new Error(
        `Unable to create invite: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapInvite(data, dto.childName);
  }

  async declineInvite(childId: string, inviteId: string, user: DecodedIdToken) {
    const child = await this.childrenService.getChildForUser(childId, user);
    const client = this.supabaseService.getAdminClient();
    const { data: existingInvite, error: existingError } = await client
      .from('invites')
      .select(
        'id, child_id, inviter_firebase_uid, inviter_email, invitee_email, status, created_at',
      )
      .eq('id', inviteId)
      .eq('child_id', childId)
      .maybeSingle<InviteRow>();

    if (existingError) {
      throw new Error(`Unable to find invite: ${existingError.message}`);
    }

    if (!existingInvite) {
      throw new NotFoundException('Invite not found.');
    }

    const { data, error } = await client
      .from('invites')
      .update({
        status: 'declined',
      })
      .eq('id', inviteId)
      .eq('child_id', childId)
      .select(
        'id, child_id, inviter_firebase_uid, inviter_email, invitee_email, status, created_at',
      )
      .single<InviteRow>();

    if (error || !data) {
      throw new Error(
        `Unable to decline invite: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapInvite(data, child.name);
  }

  async acceptInvite(inviteId: string, user: DecodedIdToken) {
    await this.ensureAppUser(user);
    const invite = await this.getInviteForInvitee(inviteId, user);

    const client = this.supabaseService.getAdminClient();
    const { error: membershipError } = await client.from('child_caregivers').upsert(
      {
        child_id: invite.child_id,
        caregiver_firebase_uid: user.uid,
        role: 'caregiver',
      },
      {
        onConflict: 'child_id,caregiver_firebase_uid',
      },
    );

    if (membershipError) {
      throw new Error(
        `Unable to add caregiver access: ${membershipError.message}`,
      );
    }

    const { data, error } = await client
      .from('invites')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', inviteId)
      .select(
        'id, child_id, inviter_firebase_uid, inviter_email, invitee_email, status, created_at',
      )
      .single<InviteRow>();

    if (error || !data) {
      throw new Error(
        `Unable to accept invite: ${error?.message ?? 'Unknown error'}`,
      );
    }

    const child = await this.childrenService.getChildForUser(invite.child_id, user);
    return this.mapInvite(data, child.name);
  }

  async declineIncomingInvite(inviteId: string, user: DecodedIdToken) {
    const invite = await this.getInviteForInvitee(inviteId, user);
    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('invites')
      .update({
        status: 'declined',
      })
      .eq('id', inviteId)
      .select(
        'id, child_id, inviter_firebase_uid, inviter_email, invitee_email, status, created_at',
      )
      .single<InviteRow>();

    if (error || !data) {
      throw new Error(
        `Unable to decline invite: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapInvite(data, invite.child_name);
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
        onConflict: 'firebase_uid',
      },
    );

    if (error) {
      throw new Error(`Unable to sync app user: ${error.message}`);
    }
  }

  private async getInviteForInvitee(inviteId: string, user: DecodedIdToken) {
    await this.ensureAppUser(user);

    if (!user.email) {
      throw new NotFoundException('Invite not found.');
    }

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('invites')
      .select(
        `
        id,
        child_id,
        inviter_firebase_uid,
        inviter_email,
        invitee_email,
        status,
        created_at,
        child:children (
          name
        )
      `,
      )
      .eq('id', inviteId)
      .eq('invitee_email', user.email.toLowerCase())
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to find invite: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('Invite not found.');
    }

    return {
      ...data,
      child_name: this.getChildName(data.child),
    };
  }

  private getChildName(child: unknown) {
    if (
      child &&
      typeof child === 'object' &&
      !Array.isArray(child) &&
      'name' in child &&
      typeof (child as { name?: unknown }).name === 'string'
    ) {
      return (child as { name: string }).name;
    }

    return 'Child';
  }

  private mapInvite(invite: InviteRow, childName: string) {
    return {
      id: invite.id,
      childId: invite.child_id,
      childName,
      inviterId: invite.inviter_firebase_uid,
      inviterEmail: invite.inviter_email,
      inviteeEmail: invite.invitee_email,
      status: invite.status,
      timestamp: invite.created_at,
    };
  }
}
