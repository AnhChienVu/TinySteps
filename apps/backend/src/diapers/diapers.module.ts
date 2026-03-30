import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChildrenModule } from '../children/children.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { DiapersController } from './diapers.controller';
import { DiapersService } from './diapers.service';

@Module({
  imports: [AuthModule, ChildrenModule, SupabaseModule],
  controllers: [DiapersController],
  providers: [DiapersService],
})
export class DiapersModule {}
