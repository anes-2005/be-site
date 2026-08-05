import { useState, type FormEvent, type ReactNode } from 'react';
import { supabase, type Collection, type DeliveryMethod } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { WILAYAS, SIZES } from '@/lib/wilayas';
import { MUNICIPALITIES } from '@/lib/algeria-data';
import { useLang, tInterpolate } from '@/lib/i18n';
import { useSettings } from '@/lib/settings-context';
import { Button } from './Button';
import { Check, Loader2, AlertCircle } from 'lucide-react';

interface PreorderFormProps {
  collection: Collection;
  onSuccess?: () => void;
}

interface FormState {
  first_name: string;
  last_name: string;
  phone: string;
  wilaya: string;
  municipality: string;
  delivery_method: DeliveryMethod;
  size: string;
  quantity: string;
  acknowledged: boolean;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

const empty: FormState = {
  first_name: '',
  last_name: '',
  phone: '',
  wilaya: '',
  municipality: '',
  delivery_method: 'home_delivery',
  size: '',
  quantity: '1',
  acknowledged: false,
};

export function PreorderForm({ collection, onSuccess }: PreorderFormProps) {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [serverError, setServerError] = useState('');
  const { t, lang } = useLang();
  const { settings } = useSettings();

  const soldOut = collection.remaining_stock <= 0 || collection.availability_status === 'sold_out';
  const disabled = soldOut || !collection.preorder_enabled;

  const isAr = lang === 'ar';
  const homeLabel = isAr && settings.shipping_home_delivery_label_ar ? settings.shipping_home_delivery_label_ar : settings.shipping_home_delivery_label;
  const officeLabel = isAr && settings.shipping_office_pickup_label_ar ? settings.shipping_office_pickup_label_ar : settings.shipping_office_pickup_label;
  const homeEnabled = settings.shipping_home_delivery_enabled;
  const officeEnabled = settings.shipping_office_pickup_enabled;
  const disabledWilayas = settings.shipping_disabled_wilayas ?? [];
  const isWilayaDisabled = form.wilaya ? disabledWilayas.includes(form.wilaya) : false;

  const availableMethods: { value: DeliveryMethod; label: string }[] = [];
  if (homeEnabled) availableMethods.push({ value: 'home_delivery', label: homeLabel });
  if (officeEnabled) availableMethods.push({ value: 'office_pickup', label: officeLabel });

  const showMunicipality = form.delivery_method === 'home_delivery' && form.wilaya !== '';
  const municipalityList = form.wilaya ? (MUNICIPALITIES[form.wilaya] ?? []) : [];

  const set = (k: keyof FormState, v: string | boolean) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const setWilaya = (w: string) => {
    setForm((f) => ({ ...f, wilaya: w, municipality: '' }));
    setErrors((e) => ({ ...e, wilaya: undefined, municipality: undefined }));
  };

  const setDeliveryMethod = (m: DeliveryMethod) => {
    setForm((f) => ({ ...f, delivery_method: m, municipality: m === 'office_pickup' ? '' : f.municipality }));
    setErrors((e) => ({ ...e, delivery_method: undefined, municipality: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name.trim()) e.first_name = t('form.firstNameReq');
    if (!form.last_name.trim()) e.last_name = t('form.lastNameReq');
    if (!form.phone.trim()) e.phone = t('form.phoneReq');
    else if (!/^[+0-9\s-]{6,}$/.test(form.phone.trim())) e.phone = t('form.phoneInvalid');
    if (!form.wilaya) e.wilaya = t('form.wilayaReq');
    else if (isWilayaDisabled) e.wilaya = t('form.wilayaDisabled');
    if (!form.delivery_method) e.delivery_method = t('form.deliveryMethodReq');
    if (form.delivery_method === 'home_delivery' && form.wilaya && !isWilayaDisabled && !form.municipality) {
      e.municipality = t('form.municipalityReq');
    }
    if (!form.size) e.size = t('form.sizeReq');
    const q = parseInt(form.quantity, 10);
    if (!q || q < 1) e.quantity = t('form.quantityReq');
    else if (collection.remaining_stock > 0 && q > collection.remaining_stock)
      e.quantity = tInterpolate(t('form.quantityRemaining'), { n: collection.remaining_stock });
    if (!form.acknowledged) e.acknowledged = t('form.acknowledgedReq');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;
    setStatus('loading');
    const { data, error } = await supabase.from('preorders').insert({
      collection_id: collection.id,
      full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      phone: form.phone.trim(),
      email: null,
      wilaya: form.wilaya,
      municipality: form.delivery_method === 'home_delivery' ? form.municipality : null,
      delivery_method: form.delivery_method,
      size: form.size,
      quantity: parseInt(form.quantity, 10),
      acknowledged: form.acknowledged,
      status: 'received',
    }).select().single();
    if (error) {
      setStatus('error');
      setServerError(t('form.serverError'));
      return;
    }
    await supabase.rpc('decrement_stock', { row_id: collection.id, amount: parseInt(form.quantity, 10) }).then(() => null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`;
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'preorder',
          preorder: {
            id: data.id,
            full_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
            phone: form.phone.trim(),
            wilaya: form.wilaya,
            municipality: form.delivery_method === 'home_delivery' ? form.municipality : null,
            delivery_method: form.delivery_method,
            size: form.size,
            quantity: parseInt(form.quantity, 10),
            collection_name: collection.name,
            price: collection.current_price ?? 0,
            currency: collection.currency ?? 'DZD',
            status: 'received',
          },
        }),
      }).catch(() => null);
    } catch { /* non-blocking */ }
    setStatus('success');
    setForm(empty);
    onSuccess?.();
  };

  if (status === 'success') {
    return (
      <div className="card flex flex-col items-center px-8 py-16 text-center">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <Check size={28} strokeWidth={1.5} />
        </div>
        <h3 className="font-serif text-[2rem] font-light text-primary">{t('form.success.title')}</h3>
        <p className="mt-3 max-w-md font-sans text-[15px] font-light text-ink/60">
          {t('form.success.body')}
        </p>
        <Button variant="outline" className="mt-10" onClick={() => navigate('/')}>
          {t('form.success.button')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="card overflow-hidden">
      {soldOut && (
        <div className="flex items-center justify-center gap-3 bg-error/5 px-6 py-5 text-error">
          <AlertCircle size={18} strokeWidth={1.5} />
          <span className="font-sans text-[12px] uppercase tracking-[0.22em]">{t('form.soldOut')}</span>
        </div>
      )}

      <div className="p-8 md:p-12">
        <p className="eyebrow mb-2">{t('form.eyebrow')}</p>
        <h3 className="font-serif text-[1.75rem] font-light text-primary">{t('form.title')}</h3>
        <p className="mt-2 font-sans text-[14px] font-light text-ink/50">
          {tInterpolate(t('form.remaining'), { remaining: String(collection.remaining_stock ?? 0), max: String(collection.max_stock || 100) })}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2">
          <Field label={t('form.firstName')} error={errors.first_name} required>
            <input
              className="field-input"
              value={form.first_name}
              onChange={(e) => set('first_name', e.target.value)}
              disabled={disabled}
              autoComplete="given-name"
            />
          </Field>
          <Field label={t('form.lastName')} error={errors.last_name} required>
            <input
              className="field-input"
              value={form.last_name}
              onChange={(e) => set('last_name', e.target.value)}
              disabled={disabled}
              autoComplete="family-name"
            />
          </Field>
          <Field label={t('form.phone')} error={errors.phone} required>
            <input
              className="field-input"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              disabled={disabled}
              inputMode="tel"
              autoComplete="tel"
            />
          </Field>
          {/* Delivery Method — segmented selector spanning full width */}
          <div className="md:col-span-2">
            <Field label={t('form.deliveryMethod')} error={errors.delivery_method} required>
              <div className="grid grid-cols-2 gap-3">
                {availableMethods.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setDeliveryMethod(m.value)}
                    disabled={disabled}
                    className={`flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3.5 font-sans text-[13px] tracking-[0.04em] transition-all duration-200 disabled:opacity-50 ${
                      form.delivery_method === m.value
                        ? 'border-primary bg-primary text-bg shadow-soft'
                        : 'border-line bg-bg-50 text-ink/60 hover:border-primary/30 hover:bg-bg-100'
                    }`}
                  >
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${form.delivery_method === m.value ? 'border-bg' : 'border-ink/30'}`}>
                      {form.delivery_method === m.value && <span className="h-2 w-2 rounded-full bg-bg" />}
                    </span>
                    {m.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label={t('form.wilaya')} error={errors.wilaya} required>
            <select
              className="field-input appearance-none"
              value={form.wilaya}
              onChange={(e) => setWilaya(e.target.value)}
              disabled={disabled}
            >
              <option value="">{t('form.wilayaPlaceholder')}</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w} disabled={disabledWilayas.includes(w)}>
                  {w}{disabledWilayas.includes(w) ? ' — Unavailable' : ''}
                </option>
              ))}
            </select>
          </Field>

          {/* Municipality — only visible for Home Delivery + after Wilaya selected */}
          {showMunicipality && !isWilayaDisabled && (
            <Field label={t('form.municipality')} error={errors.municipality} required>
              <select
                className="field-input appearance-none"
                value={form.municipality}
                onChange={(e) => set('municipality', e.target.value)}
                disabled={disabled}
              >
                <option value="">{t('form.municipalityPlaceholder')}</option>
                {municipalityList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          )}

          {/* When Office Pickup, show a note in the municipality slot */}
          {form.delivery_method === 'office_pickup' && form.wilaya && !isWilayaDisabled && (
            <div className="flex items-center">
              <p className="font-sans text-[12px] font-light text-ink/40">
                {isAr
                  ? 'سيتم التوصيل إلى مكتب الشحن في الولاية المحددة.'
                  : 'Your order will be delivered to the shipping office of the selected wilaya.'}
              </p>
            </div>
          )}

          <Field label={t('form.size')} error={errors.size} required>
            <select
              className="field-input appearance-none"
              value={form.size}
              onChange={(e) => set('size', e.target.value)}
              disabled={disabled}
            >
              <option value="">{t('form.sizePlaceholder')}</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('form.quantity')} error={errors.quantity} required>
            <input
              className="field-input"
              type="number"
              min={1}
              max={collection.remaining_stock > 0 ? collection.remaining_stock : 1}
              value={form.quantity}
              onChange={(e) => set('quantity', e.target.value)}
              disabled={disabled}
            />
          </Field>
        </div>

        <label className="mt-8 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={form.acknowledged}
            onChange={(e) => set('acknowledged', e.target.checked)}
            disabled={disabled}
            className="mt-1 h-4 w-4 accent-primary"
          />
          <span className="font-sans text-[13px] font-light text-ink/70">
            {t('form.acknowledged')}
          </span>
        </label>
        {errors.acknowledged && <p className="field-error">{errors.acknowledged}</p>}

        {serverError && (
          <div className="mt-6 flex items-center gap-2 text-error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span className="font-sans text-[13px]">{serverError}</span>
          </div>
        )}

        <div className="mt-10">
          {soldOut ? (
            <Button variant="outline" disabled className="w-full">
              {t('form.soldOut')}
            </Button>
          ) : (
            <Button type="submit" disabled={status === 'loading'} className="w-full" size="lg">
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                  {t('form.submitting')}
                </>
              ) : (
                t('form.submit')
              )}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="field-label">
        {label} {required && <span className="text-ink/30 normal-case tracking-normal">·</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
