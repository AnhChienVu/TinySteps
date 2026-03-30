import { Controller, Get } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Controller('database')
export class SupabaseController {
  constructor(private readonly supabaseService: SupabaseService) {}

  @Get('health')
  async getDatabaseHealth() {
    const result = await this.supabaseService.checkConnection();

    return {
      status: 'ok',
      database: 'supabase',
      ...result,
      timestamp: new Date().toISOString(),
    };
  }
}
