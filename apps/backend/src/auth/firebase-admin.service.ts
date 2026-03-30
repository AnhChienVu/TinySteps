/*
Purpose:
- connect the Nest backend to Firebase Admin
- initialize one Firebase Admin app per running backend process
- expose Firebase Auth so guards/controllers can verify frontend tokens
*/

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  App,
  cert,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Auth, getAuth } from 'firebase-admin/auth';

@Injectable()
export class FirebaseAdminService {
  private app: App; // In-memory Firebase Admin app instance for this Node process
  private auth: Auth; // Firebase Admin Auth API used to verify ID tokens

  constructor(private readonly configService: ConfigService) {
    // This constructor runs when Nest creates the service during backend startup.
    // If you stop and restart the backend, this runs again in a brand-new process.
    this.app = this.initializeFirebaseAdmin();
    this.auth = getAuth(this.app);
  }

  getAuth() {
    return this.auth;
  }

  // Create the Firebase Admin app, but reuse it if it already exists
  // in the current running backend process.
  private initializeFirebaseAdmin() {
    // This is only a local runtime name for the Firebase Admin app instance.
    // It is NOT the app name shown in Firebase Console.
    const appName = 'tinysteps-backend';

    // In watch/dev mode, code can be reloaded in the same process.
    // Reusing the existing app avoids "app already exists" errors.
    if (getApps().some((app) => app.name === appName)) {
      return getApp(appName);
    }

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase Admin environment variables are missing. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
      );
    }

    // Service account private keys usually come from .env as one string
    // with "\n" characters, so we convert them back to real line breaks.
    return initializeApp(
      {
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      },
      appName,
    );
  }
}
