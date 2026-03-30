import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChildrenModule } from '../children/children.module';
import { SupabaseModule } from '../supabase/supabase.module';
import { IncomingInvitesController } from './incoming-invites.controller';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [AuthModule, ChildrenModule, SupabaseModule],
  controllers: [InvitesController, IncomingInvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
