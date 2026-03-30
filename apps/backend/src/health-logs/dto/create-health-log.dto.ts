import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateHealthLogDto {
  @IsDateString()
  timestamp!: string;

  @IsIn(['symptom', 'medication', 'doctor', 'vaccination'])
  type!: 'symptom' | 'medication' | 'doctor' | 'vaccination';

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
