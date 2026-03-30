import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChildrenModule } from '../children/children.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { FeedingsController } from './feedings.controller';
import { FeedingsService } from './feedings.service';

@Module({
  imports: [AuthModule, ChildrenModule, SupabaseModule],
  controllers: [FeedingsController],
  providers: [FeedingsService],
})
export class FeedingsModule {}
