'use client';

/**
 * Login Form Component
 * T030: Enhanced error handling for rate limit messages with retry time
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface RateLimitInfo {
  remaining: number;
  resetAt: number;
}

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);

  /**
   * Format time remaining until rate limit reset
   */
  const formatTimeRemaining = (resetAt: number): string => {
    const now = Date.now();
    const diffMs = resetAt - now;

    if (diffMs <= 0) return 'now';

    const diffMinutes = Math.ceil(diffMs / (60 * 1000));

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
    }

    const diffHours = Math.ceil(diffMinutes / 60);
    return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRateLimitInfo(null);
    setLoading(true);

    try {
      // Use our API endpoint which includes rate limiting
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      // Handle rate limiting (429)
      if (response.status === 429) {
        const resetAt = data.error?.resetAt || (Date.now() + 15 * 60 * 1000);
        const remaining = data.error?.remaining ?? 0;

        setRateLimitInfo({ remaining, resetAt });
        setError(`Too many login attempts. Please try again in ${formatTimeRemaining(resetAt)}.`);
        setLoading(false);
        return;
      }

      // Handle auth errors
      if (!response.ok) {
        // Include rate limit info if available (failed attempts)
        if (data.remaining !== undefined && data.resetAt) {
          setRateLimitInfo({
            remaining: data.remaining,
            resetAt: data.resetAt,
          });
        }

        setError(data.error?.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Success - set cookies through Supabase client
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      // Redirect to appropriate dashboard
      router.push(redirectTo || '/');
      router.refresh();
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className={`rounded-md p-4 text-sm ${
            rateLimitInfo
              ? 'bg-amber-50 text-amber-800 border border-amber-200'
              : 'bg-red-50 text-red-800'
          }`}
          role="alert"
        >
          <div className="flex items-start">
            {rateLimitInfo && (
              <svg
                className="h-5 w-5 mr-2 flex-shrink-0 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <div>
              <p>{error}</p>
              {rateLimitInfo && rateLimitInfo.remaining > 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  {rateLimitInfo.remaining} attempt{rateLimitInfo.remaining === 1 ? '' : 's'} remaining
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      </div>

      <div className="flex items-center justify-between">
        <a href="/reset-password" className="text-sm text-primary-600 hover:text-primary-500">
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
