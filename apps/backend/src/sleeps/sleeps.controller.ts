import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateSleepDto } from './dto/create-sleep.dto';
import { SleepsService } from './sleeps.service';

@Controller('children/:childId/sleeps')
@UseGuards(FirebaseAuthGuard)
export class SleepsController {
  constructor(private readonly sleepsService: SleepsService) {}

  @Get()
  listSleeps(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.sleepsService.listSleepsForChild(childId, user);
  }

  @Post()
  createSleep(
    @Param('childId') childId: string,
    @Body() createSleepDto: CreateSleepDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.sleepsService.createSleep(childId, user, createSleepDto);
  }
}
