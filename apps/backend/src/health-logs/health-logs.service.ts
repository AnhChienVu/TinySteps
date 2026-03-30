import { Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ChildrenService } from '../children/children.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateHealthLogDto } from './dto/create-health-log.dto';

type HealthLogRow = {
  id: string;
  child_id: string;
  logged_by_firebase_uid: string;
  occurred_at: string;
  type: 'symptom' | 'medication' | 'doctor' | 'vaccination';
  title: string;
  notes: string | null;
};

@Injectable()
export class HealthLogsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly childrenService: ChildrenService,
  ) {}

  async listHealthLogsForChild(childId: string, user: DecodedIdToken) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('health_logs')
      .select(
        'id, child_id, logged_by_firebase_uid, occurred_at, type, title, notes',
      )
      .eq('child_id', childId)
      .order('occurred_at', { ascending: false })
      .returns<HealthLogRow[]>();

    if (error) {
      throw new Error(`Unable to fetch health logs: ${error.message}`);
    }

    return (data ?? []).map((item) => this.mapHealthLog(item));
  }

  async createHealthLog(
    childId: string,
    user: DecodedIdToken,
    dto: CreateHealthLogDto,
  ) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('health_logs')
      .insert({
        child_id: childId,
        logged_by_firebase_uid: user.uid,
        occurred_at: dto.timestamp,
        type: dto.type,
        title: dto.title.trim(),
        notes: dto.notes?.trim() || null,
      })
      .select(
        'id, child_id, logged_by_firebase_uid, occurred_at, type, title, notes',
      )
      .single<HealthLogRow>();

    if (error || !data) {
      throw new Error(
        `Unable to create health log: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapHealthLog(data);
  }

  private mapHealthLog(item: HealthLogRow) {
    return {
      id: item.id,
      childId: item.child_id,
      timestamp: item.occurred_at,
      type: item.type,
      title: item.title,
      notes: item.notes ?? undefined,
      loggedBy: item.logged_by_firebase_uid,
    };
  }
}
