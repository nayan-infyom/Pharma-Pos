import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Mail, Lock, Stethoscope } from 'lucide-react';

/**
 * The only genuinely new screen in Phase K. The pre-migration frontend had no
 * login flow at all (useAppStore.currentUser was a hardcoded seed employee) —
 * every backend endpoint requires a JWT, so this is a necessary addition, not
 * a redesign. Built entirely from existing UI primitives and the existing
 * light theme; nothing about the rest of the app's visual language changes.
 */
export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAppStore();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // duplicate-submit guard
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      // Server intentionally returns a generic message for any failure reason
      // (unknown email, wrong password, inactive account) — displayed as-is.
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-5 text-center">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm mb-3">
            <Stethoscope className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Apex Care Pharmacy</h1>
          <p className="text-xs text-slate-500 mt-0.5">Sign in to the pharmacy management system</p>
        </div>

        <Card>
          <CardHeader className="flex-col items-start">
            <CardTitle>Staff Sign In</CardTitle>
            <CardDescription>Use your registered work email and password.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <Input
                type="email"
                label="Email"
                placeholder="you@apexpharma.com"
                leftIcon={<Mail className="w-4 h-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />
              <Input
                type="password"
                label="Password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              {error && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2" role="alert">
                  {error}
                </div>
              )}

              <Button type="submit" variant="primary" size="md" className="w-full" isLoading={isSubmitting}>
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
