import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateInviteDto } from './dto/create-invite.dto';
import { InvitesService } from './invites.service';

@Controller('children/:childId/invites')
@UseGuards(FirebaseAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Get()
  listInvites(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.invitesService.listInvitesForChild(childId, user);
  }

  @Post()
  createInvite(
    @Param('childId') childId: string,
    @Body() createInviteDto: CreateInviteDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.invitesService.createInvite(childId, user, createInviteDto);
  }

  @Patch(':inviteId/decline')
  declineInvite(
    @Param('childId') childId: string,
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.invitesService.declineInvite(childId, inviteId, user);
  }
}
