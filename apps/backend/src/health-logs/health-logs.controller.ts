import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateHealthLogDto } from './dto/create-health-log.dto';
import { HealthLogsService } from './health-logs.service';

@Controller('children/:childId/health-logs')
@UseGuards(FirebaseAuthGuard)
export class HealthLogsController {
  constructor(private readonly healthLogsService: HealthLogsService) {}

  @Get()
  listHealthLogs(
    @Param('childId') childId: string,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.healthLogsService.listHealthLogsForChild(childId, user);
  }

  @Post()
  createHealthLog(
    @Param('childId') childId: string,
    @Body() createHealthLogDto: CreateHealthLogDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.healthLogsService.createHealthLog(
      childId,
      user,
      createHealthLogDto,
    );
  }
}
