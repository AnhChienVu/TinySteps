import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateDiaperDto } from './dto/create-diaper.dto';
import { DiapersService } from './diapers.service';

@Controller('children/:childId/diapers')
@UseGuards(FirebaseAuthGuard)
export class DiapersController {
  constructor(private readonly diapersService: DiapersService) {}

  @Get()
  listDiapers(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.diapersService.listDiapersForChild(childId, user);
  }

  @Post()
  createDiaper(
    @Param('childId') childId: string,
    @Body() createDiaperDto: CreateDiaperDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.diapersService.createDiaper(childId, user, createDiaperDto);
  }
}
