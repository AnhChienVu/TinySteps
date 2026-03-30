import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChildrenModule } from '../children/children.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';

@Module({
  imports: [AuthModule, ChildrenModule, SupabaseModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
