import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { DiapersModule } from './diapers/diapers.module';
import { FeedingsModule } from './feedings/feedings.module';
import { HealthModule } from './health/health.module';
import { HealthLogsModule } from './health-logs/health-logs.module';
import { InvitesModule } from './invites/invites.module';
import { SleepsModule } from './sleeps/sleeps.module';
import { SupabaseModule } from './supabase/supabase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }), // This module manages environment variables
    AiChatModule,
    AuthModule,
    ChildrenModule,
    DiapersModule,
    FeedingsModule,
    HealthModule,
    HealthLogsModule,
    InvitesModule,
    SleepsModule,
    SupabaseModule,
  ],
})
export class AppModule {}
