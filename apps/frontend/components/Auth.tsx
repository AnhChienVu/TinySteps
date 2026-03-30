'use client';

import React, { useState } from 'react';
import { Button, Input, Card } from './UI';
import { Home } from 'lucide-react';
import {
  getAuthErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/lib/services/auth-service';
import { createAppSession } from '@/lib/services/session-service';

export function Auth({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);



  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail({
          email,
          password,
          name,
        });
      }

      await createAppSession();
      onAuthSuccess?.();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      await createAppSession();
      onAuthSuccess?.();
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
      console.error('Google sign-in failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-warm-bg">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="serif text-3xl font-semibold mb-2">
            {isLogin ? 'Welcome Back' : 'Join TinySteps'}
          </h2>
          <p className="text-black/40">
            {isLogin
              ? "Log in to track your baby's progress"
              : 'Start your parenting journey today'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Jane Doe"
            />
          )}
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />

          {error && <p className="text-red-500 text-xs text-center">{error}</p>}

          <Button className="w-full" disabled={loading}>
            {loading ? 'Processing...' : isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/5"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-black/40">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full mt-6 flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <Home size={18} />
          Google
        </Button>

        <p className="mt-8 text-center text-sm text-black/40">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-olive font-semibold hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </p>
      </Card>
    </div>
  );
}
