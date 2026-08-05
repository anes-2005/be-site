import { useState } from 'react';
import { useAdminAuth } from '@/lib/admin-auth';
import { useSettings } from '@/lib/settings-context';
import { useLang } from '@/lib/i18n';
import { Logo } from '@/components/Logo';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

export function AdminLogin() {
  const { login, error } = useAdminAuth();
  const { settings } = useSettings();
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await login(password);
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-100 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo className="!h-9" />
          <p className="mt-5 font-sans text-[11px] uppercase tracking-[0.22em] text-ink/40">
            {settings.brand_name} {t('admin.login.adminLabel')}
          </p>
        </div>

        <form onSubmit={submit} className="card p-8 md:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
              <Lock size={17} strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-serif text-[1.5rem] font-light text-primary">{t('admin.login.title')}</h1>
              <p className="font-sans text-[12px] text-ink/45">{t('admin.login.subtitle')}</p>
            </div>
          </div>

          <label className="field-label">{t('admin.login.password')}</label>
          <div className="relative">
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              className="field-input pr-11"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={submitting || password.length === 0}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-bg-200 hover:text-primary disabled:opacity-40"
              aria-label="Sign in"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={16} strokeWidth={1.5} />}
            </button>
          </div>

          {error && (
            <p className="mt-3 font-sans text-[12px] text-error">{error || t('admin.login.error')}</p>
          )}

          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="btn-primary mt-6 w-full"
          >
            {submitting ? <Loader2 size={15} className="animate-spin" /> : t('admin.login.submit')}
          </button>
        </form>

        <p className="mt-8 text-center font-sans text-[11px] text-ink/30">
          {t('admin.login.restricted')}
        </p>
      </div>
    </div>
  );
}
