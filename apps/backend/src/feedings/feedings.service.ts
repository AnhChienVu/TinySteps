import { Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ChildrenService } from '../children/children.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFeedingDto } from './dto/create-feeding.dto';

type FeedingRow = {
  id: string;
  child_id: string;
  logged_by_firebase_uid: string;
  occurred_at: string;
  type: 'breast' | 'bottle' | 'solid';
  amount: number | string | null;
  unit: string | null;
  notes: string | null;
};

@Injectable()
export class FeedingsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly childrenService: ChildrenService,
  ) {}

  async listFeedingsForChild(childId: string, user: DecodedIdToken) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('feedings')
      .select(
        'id, child_id, logged_by_firebase_uid, occurred_at, type, amount, unit, notes',
      )
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false })
      .returns<FeedingRow[]>();

    if (error) {
      throw new Error(`Unable to fetch feedings: ${error.message}`);
    }

    return (data ?? []).map((feeding) => this.mapFeeding(feeding));
  }

  async createFeeding(
    childId: string,
    user: DecodedIdToken,
    dto: CreateFeedingDto,
  ) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('feedings')
      .insert({
        child_id: childId,
        logged_by_firebase_uid: user.uid,
        occurred_at: dto.timestamp,
        type: dto.type,
        amount: dto.amount ?? null,
        unit: dto.unit?.trim() || null,
        notes: dto.notes?.trim() || null,
      })
      .select(
        'id, child_id, logged_by_firebase_uid, occurred_at, type, amount, unit, notes',
      )
      .single<FeedingRow>();

    if (error || !data) {
      throw new Error(
        `Unable to create feeding log: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapFeeding(data);
  }

  private mapFeeding(feeding: FeedingRow) {
    return {
      id: feeding.id,
      childId: feeding.child_id,
      timestamp: feeding.occurred_at,
      type: feeding.type,
      amount:
        typeof feeding.amount === 'number'
          ? feeding.amount
          : typeof feeding.amount === 'string'
            ? Number(feeding.amount)
            : undefined,
      unit: feeding.unit ?? undefined,
      notes: feeding.notes ?? undefined,
      loggedBy: feeding.logged_by_firebase_uid,
    };
  }
}
