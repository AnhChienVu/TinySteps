import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseController } from './supabase.controller';
import { SupabaseService } from './supabase.service';

@Module({
  imports: [ConfigModule],
  controllers: [SupabaseController],
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
