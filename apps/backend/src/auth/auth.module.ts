import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './auth.guard';

@Module({
  imports: [ConfigModule], // To be able to use ConfigService inside AuthModule. However, it's not necessary because I imported it in AppModule and set global already
  controllers: [AuthController],
  providers: [FirebaseAdminService, FirebaseAuthGuard], // Register services to DI
  exports: [FirebaseAdminService, FirebaseAuthGuard], // Allow other modules can use providers exported from this module.
})
export class AuthModule {}
