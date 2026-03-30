import { IsEmail, IsString, MaxLength } from 'class-validator';

export class CreateInviteDto {
  @IsEmail()
  @MaxLength(320)
  inviteeEmail!: string;

  @IsString()
  @MaxLength(120)
  childName!: string;
}
