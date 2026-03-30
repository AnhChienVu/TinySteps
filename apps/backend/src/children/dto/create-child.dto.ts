import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChildDto {
  @IsString()
  @MaxLength(120)
  name!: string; // !: it's definite assignment assertion. Because there is no value assigned to this variable now, so this sign makes sure to NestJs that it will be assigned later (from request)

  @IsDateString()
  birthDate!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
