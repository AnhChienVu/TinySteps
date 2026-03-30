import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  // Instance to connect to Supabase and to query database
  private readonly client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!url || !serviceRoleKey) {
      throw new Error(
        'Supabase environment variables are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  getAdminClient() {
    return this.client;
  }

  async checkConnection() {
    const { count, error } = await this.client
      .from('app_users')
      .select('firebase_uid', { count: 'exact', head: true }); // head: true (only get metadata, not data); count: 'exact' (count nums of records)

    if (error) {
      throw new Error(`Supabase query failed: ${error.message}`);
    }

    return {
      connected: true,
      appUsersCount: count ?? 0,
    };
  }
}
