import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChildrenModule } from '../children/children.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { HealthLogsController } from './health-logs.controller';
import { HealthLogsService } from './health-logs.service';

@Module({
  imports: [AuthModule, ChildrenModule, SupabaseModule],
  controllers: [HealthLogsController],
  providers: [HealthLogsService],
})
export class HealthLogsModule {}
