import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChildrenModule } from '../children/children.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { SleepsController } from './sleeps.controller';
import { SleepsService } from './sleeps.service';

@Module({
  imports: [AuthModule, ChildrenModule, SupabaseModule],
  controllers: [SleepsController],
  providers: [SleepsService],
})
export class SleepsModule {}
