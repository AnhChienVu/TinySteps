import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ChatHistoryMessageDto {
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @IsString()
  @MaxLength(4000)
  text!: string;
}

export class CreateAiChatMessageDto {
  @IsString()
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryMessageDto)
  recentMessages?: ChatHistoryMessageDto[];
}
