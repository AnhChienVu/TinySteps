import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDiaperDto {
  @IsDateString()
  timestamp!: string;

  @IsIn(['wet', 'dry', 'both'])
  type!: 'wet' | 'dry' | 'both';

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
