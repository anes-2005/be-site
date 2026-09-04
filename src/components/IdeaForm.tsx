import { useState, type FormEvent } from 'react';
import { useLang } from '@/lib/i18n';
import { submitIdea } from '@/lib/ideas';
import { Button } from './Button';
import { Loader2, Check, AlertCircle, Sparkles } from 'lucide-react';

export function IdeaForm() {
  const { t } = useLang();
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fieldError, setFieldError] = useState<{ name?: string; message?: string }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; message?: string } = {};
    if (!name.trim()) errors.name = t('idea.nameReq');
    if (!message.trim()) errors.message = t('idea.messageReq');
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;

    setStatus('sending');
    const res = await submitIdea({ name, contact, message });
    if (res.ok) {
      setStatus('success');
      setName('');
      setContact('');
      setMessage('');
    } else {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
          <Check size={22} strokeWidth={1.5} className="text-success" />
        </div>
        <p className="font-serif text-[1.4rem] font-light text-primary">{t('idea.success')}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="font-sans text-[12px] uppercase tracking-[0.14em] text-ink/40 underline-offset-4 hover:text-primary hover:underline"
        >
          {t('idea.submit')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/15">
          <Sparkles size={16} strokeWidth={1.5} className="text-secondary" />
        </div>
        <p className="font-sans text-[12px] font-light leading-relaxed text-ink/50">
          {t('idea.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="field-label">{t('idea.name')}</label>
          <input
            className="field-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
          {fieldError.name && <p className="mt-1.5 font-sans text-[12px] text-error">{fieldError.name}</p>}
        </div>
        <div>
          <label className="field-label">{t('idea.contact')}</label>
          <input
            className="field-input"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            maxLength={120}
          />
        </div>
      </div>

      <div className="mt-5">
        <label className="field-label">{t('idea.message')}</label>
        <textarea
          className="field-input min-h-[120px] resize-y"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('idea.messagePlaceholder')}
          maxLength={1000}
          rows={4}
        />
        {fieldError.message && <p className="mt-1.5 font-sans text-[12px] text-error">{fieldError.message}</p>}
      </div>

      {status === 'error' && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error">
          <AlertCircle size={15} strokeWidth={1.5} />
          <span className="font-sans text-[13px]">{t('idea.error')}</span>
        </div>
      )}

      <div className="mt-7 flex justify-center md:justify-end">
        <Button type="submit" size="lg" disabled={status === 'sending'}>
          {status === 'sending' ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              {t('idea.sending')}
            </>
          ) : (
            t('idea.submit')
          )}
        </Button>
      </div>
    </form>
  );
}
