import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFeedingDto {
  @IsDateString()
  timestamp!: string;

  @IsIn(['breast', 'bottle', 'solid'])
  type!: 'breast' | 'bottle' | 'solid';

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
