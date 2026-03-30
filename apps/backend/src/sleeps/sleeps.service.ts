import { Injectable } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { ChildrenService } from '../children/children.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateSleepDto } from './dto/create-sleep.dto';

type SleepRow = {
  id: string;
  child_id: string;
  logged_by_firebase_uid: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
};

@Injectable()
export class SleepsService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly childrenService: ChildrenService,
  ) {}

  async listSleepsForChild(childId: string, user: DecodedIdToken) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('sleeps')
      .select('id, child_id, logged_by_firebase_uid, start_time, end_time, notes')
      .eq('child_id', childId)
      .order('start_time', { ascending: false })
      .returns<SleepRow[]>();

    if (error) {
      throw new Error(`Unable to fetch sleep logs: ${error.message}`);
    }

    return (data ?? []).map((sleep) => this.mapSleep(sleep));
  }

  async createSleep(
    childId: string,
    user: DecodedIdToken,
    dto: CreateSleepDto,
  ) {
    await this.childrenService.getChildForUser(childId, user);

    const client = this.supabaseService.getAdminClient();
    const { data, error } = await client
      .from('sleeps')
      .insert({
        child_id: childId,
        logged_by_firebase_uid: user.uid,
        start_time: dto.startTime,
        end_time: dto.endTime ?? null,
        notes: dto.notes?.trim() || null,
      })
      .select('id, child_id, logged_by_firebase_uid, start_time, end_time, notes')
      .single<SleepRow>();

    if (error || !data) {
      throw new Error(
        `Unable to create sleep log: ${error?.message ?? 'Unknown error'}`,
      );
    }

    return this.mapSleep(data);
  }

  private mapSleep(sleep: SleepRow) {
    return {
      id: sleep.id,
      childId: sleep.child_id,
      startTime: sleep.start_time,
      endTime: sleep.end_time ?? undefined,
      notes: sleep.notes ?? undefined,
      loggedBy: sleep.logged_by_firebase_uid,
    };
  }
}
