import { Controller, Get, UseGuards } from '@nestjs/common';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getCurrentUser(@CurrentUser() user: DecodedIdToken) {
    return {
      uid: user.uid,
      email: user.email ?? null,
      name: user.name ?? null,
      picture: user.picture ?? null,
    };
  }
}
