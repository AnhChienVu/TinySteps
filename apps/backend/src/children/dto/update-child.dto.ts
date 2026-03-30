import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateChildDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
