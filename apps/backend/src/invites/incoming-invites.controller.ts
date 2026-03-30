import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { InvitesService } from './invites.service';

@Controller('invites')
@UseGuards(FirebaseAuthGuard)
export class IncomingInvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get('me')
  listIncomingInvites(@CurrentUser() user: DecodedIdToken) {
    return this.invitesService.listIncomingInvites(user);
  }

  @Patch(':inviteId/accept')
  acceptInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.invitesService.acceptInvite(inviteId, user);
  }

  @Patch(':inviteId/decline')
  declineIncomingInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.invitesService.declineIncomingInvite(inviteId, user);
  }
}
