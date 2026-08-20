'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Sparkles, Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { login } from '@/app/(auth)/actions';
import { useI18n } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CrochetLogo } from '@/components/ui/crochet-logo';
import { GoogleAuthButton } from '@/components/auth/google-auth-button';

export default function LoginPage() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-yarn-50">

      {/* Top logo & language toggle */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <LanguageSwitcher />
        </div>
        <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
          <CrochetLogo size="lg" />
          <span className="text-2xl font-bold font-serif tracking-tight text-yarn-900">
            {t.common.brandName}
          </span>
        </Link>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-yarn-900">
          {t.auth.welcomeBack}
        </h2>
        <p className="mt-2 text-sm text-yarn-700">
          {t.auth.loginSubtitle}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-yarn-200 shadow-lift">

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google 1-Click Login */}
          <div className="mb-6">
            <GoogleAuthButton label={t.auth.googleContinue} disabled={loading} />
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-yarn-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 text-yarn-500 font-medium">{t.auth.orDivider}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-yarn-700 mb-1.5">
                {t.auth.emailLabel}
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-yarn-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@email.com"
                  className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-yarn-300 text-yarn-900 placeholder:text-yarn-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm bg-yarn-50/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-yarn-700 mb-1.5">
                {t.auth.passwordLabel}
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-yarn-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 rounded-2xl border border-yarn-300 text-yarn-900 placeholder:text-yarn-400 focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent text-sm bg-yarn-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-sage-800 to-sage-600 hover:from-sage-900 hover:to-sage-700 shadow-soft hover:shadow-lift transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t.auth.loggingIn}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{t.auth.loginButton}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-yarn-100 text-center">
            <p className="text-sm text-yarn-700">
              {t.auth.noAccount}{' '}
              <Link href="/signup" className="font-semibold text-sage-700 hover:text-sage-900 underline underline-offset-2">
                {t.auth.signupLink}
              </Link>
            </p>
          </div>

        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-yarn-600 hover:text-yarn-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t.common.backToHome}
          </Link>
        </div>
      </div>
    </div>
  );
}
