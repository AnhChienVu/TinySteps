import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { FirebaseAdminService } from './firebase-admin.service';

export type AuthenticatedRequest = Request & {
  user?: DecodedIdToken;
};

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAdminService: FirebaseAdminService) {}

  // This is where request is received and check auth before going to controller
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Missing Authorization header.');
    }

    const [scheme, token] = authorizationHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Authorization header must use Bearer <token> format.',
      );
    }

    try {
      const decodedToken =
        await this.firebaseAdminService.getAuth().verifyIdToken(token);

      request.user = decodedToken;
      return true;
    } catch {
      throw new UnauthorizedException('Firebase token is invalid or expired.');
    }
  }
}
