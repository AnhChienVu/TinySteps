import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AiChatService } from './ai-chat.service';
import { CreateAiChatMessageDto } from './dto/create-ai-chat-message.dto';

@Controller('children/:childId/ai-chat')
@UseGuards(FirebaseAuthGuard)
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post()
  createReply(
    @Param('childId') childId: string,
    @Body() createAiChatMessageDto: CreateAiChatMessageDto,
    @CurrentUser() user: DecodedIdToken,
  ) {
    return this.aiChatService.createReply(childId, user, createAiChatMessageDto);
  }
}
