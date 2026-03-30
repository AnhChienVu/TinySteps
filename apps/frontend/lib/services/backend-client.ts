import { getCurrentUser } from '@/lib/services/auth-service';

const backendBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api'
).replace(/\/$/, '');

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload
  ) {
    const message = payload.message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

export async function fetchBackend<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const user = getCurrentUser();

  if (!user) {
    throw new Error('You need to be signed in to continue.');
  }

  const token = await user.getIdToken();
  const headers = new Headers(init.headers);

  headers.set('Authorization', `Bearer ${token}`);

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload, 'The backend request could not be completed.'),
    );
  }

  return payload as T;
}

export function getBackendBaseUrl() {
  return backendBaseUrl;
}
