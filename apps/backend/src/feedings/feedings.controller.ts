import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateFeedingDto } from './dto/create-feeding.dto';
import { FeedingsService } from './feedings.service';

@Controller('children/:childId/feedings')
@UseGuards(FirebaseAuthGuard)
export class FeedingsController {
  constructor(private readonly feedingsService: FeedingsService) {}

  @Get()
  listFeedings(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.feedingsService.listFeedingsForChild(childId, user);
  }

  @Post()
  createFeeding(
    @Param('childId') childId: string,
    @Body() createFeedingDto: CreateFeedingDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.feedingsService.createFeeding(childId, user, createFeedingDto);
  }
}
