import { useEffect, useState } from 'react';
import { useSettings } from '@/lib/settings-context';
import { saveSettings } from '@/lib/settings';
import { AdminLayout } from './AdminLayout';
import { useSeo } from '@/lib/seo';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Save, Check, Loader2, AlertCircle, Mail, Sheet, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';

export function AdminGoogleIntegrations() {
  useSeo({ title: 'be — Google Integrations', description: 'Gmail + Google Sheets.' });
  const { settings, reload } = useSettings();
  const [draft, setDraft] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => { setDraft(settings); }, [settings]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    const ok = await saveSettings({
      google_enabled: draft.google_enabled,
      gmail_address: draft.gmail_address,
      google_sheet_id: draft.google_sheet_id,
      google_sheet_tab: draft.google_sheet_tab,
      google_service_account: draft.google_service_account,
      email_notifications_enabled: draft.email_notifications_enabled,
      resend_from_email: draft.resend_from_email,
      resend_from_name: draft.resend_from_name,
    });
    setSaving(false);
    if (ok) {
      setSaved(true);
      await reload();
      setTimeout(() => setSaved(false), 2500);
    } else {
      setError('Could not save. Please try again.');
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-integration`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ action: 'test' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTestResult(data.message || 'Connection successful.');
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout active="/admin/google">
      <div className="px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-[2rem] font-light text-primary">Google Integrations</h1>
            <p className="mt-1 font-sans text-[13px] text-ink/45">Send every preorder to Google Sheets and notify your Gmail.</p>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} strokeWidth={1.5} /> : <Save size={15} strokeWidth={1.5} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-error/20 bg-error/5 px-4 py-3 text-error">
            <AlertCircle size={16} strokeWidth={1.5} />
            <span className="font-sans text-[13px]">{error}</span>
          </div>
        )}

        <div className="mt-8 space-y-6">
          {/* Master toggle */}
          <div className="card p-6 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-[1.5rem] font-light text-primary">Integration Status</h2>
                <p className="mt-1 font-sans text-[12px] text-ink/45">Turn on to activate Google Sheets + Gmail for every preorder.</p>
              </div>
              <button
                type="button"
                onClick={() => set('google_enabled', !draft.google_enabled)}
                className="flex items-center gap-2"
              >
                {draft.google_enabled ? (
                  <ToggleRight size={40} strokeWidth={1.2} className="text-primary" />
                ) : (
                  <ToggleLeft size={40} strokeWidth={1.2} className="text-ink/30" />
                )}
              </button>
            </div>
            <div className="mt-4">
              {draft.google_enabled ? <Badge tone="success">Enabled</Badge> : <Badge tone="warning">Disabled</Badge>}
            </div>
          </div>

          {/* Email Notifications */}
          <div className="card p-6 md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                  <Mail size={18} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="font-serif text-[1.5rem] font-light text-primary">Email Notifications</h2>
                  <p className="mt-0.5 font-sans text-[12px] text-ink/45">Receive an email for every new preorder via Resend.</p>
                </div>
              </div>
              <button type="button" onClick={() => set('email_notifications_enabled', !draft.email_notifications_enabled)} className="flex items-center gap-2">
                {draft.email_notifications_enabled ? <ToggleRight size={40} strokeWidth={1.2} className="text-primary" /> : <ToggleLeft size={40} strokeWidth={1.2} className="text-ink/30" />}
              </button>
            </div>
            {draft.email_notifications_enabled && (
              <div className="space-y-5">
                <div>
                  <label className="field-label">Notification Email Address</label>
                  <input className="field-input" type="email" value={draft.gmail_address ?? ''} placeholder="you@gmail.com" onChange={(e) => set('gmail_address', e.target.value || null)} />
                  <p className="mt-2 font-sans text-[11px] text-ink/40">Each preorder sends a branded email here automatically.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="field-label">From Name</label>
                    <input className="field-input" value={draft.resend_from_name ?? ''} placeholder="be Preorders" onChange={(e) => set('resend_from_name', e.target.value)} />
                  </div>
                  <div>
                    <label className="field-label">From Email (optional)</label>
                    <input className="field-input" type="email" value={draft.resend_from_email ?? ''} placeholder="noreply@yourdomain.com" onChange={(e) => set('resend_from_email', e.target.value || null)} />
                    <p className="mt-2 font-sans text-[11px] text-ink/40">Leave empty to use Resend's default sender.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Google Sheets */}
          <div className="card p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <Sheet size={18} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="font-serif text-[1.5rem] font-light text-primary">Google Sheets</h2>
                <p className="mt-0.5 font-sans text-[12px] text-ink/45">Every preorder is saved as a new row.</p>
              </div>
            </div>
            <div className="space-y-5">
              <div>
                <label className="field-label">Spreadsheet ID</label>
                <input
                  className="field-input"
                  value={draft.google_sheet_id ?? ''}
                  placeholder="e.g. 1AbcDefGhIjKlMnOpQrStUvWxYz1234567890"
                  onChange={(e) => set('google_sheet_id', e.target.value || null)}
                />
                <p className="mt-2 font-sans text-[11px] text-ink/40">Found in your sheet URL: docs.google.com/spreadsheets/d/<span className="font-medium">THIS_PART</span>/edit</p>
              </div>
              <div>
                <label className="field-label">Sheet Tab Name</label>
                <input
                  className="field-input"
                  value={draft.google_sheet_tab}
                  placeholder="Preorders"
                  onChange={(e) => set('google_sheet_tab', e.target.value)}
                />
                <p className="mt-2 font-sans text-[11px] text-ink/40">The tab/worksheet name inside your spreadsheet.</p>
              </div>
              <div>
                <label className="field-label">Service Account JSON</label>
                <textarea
                  className="field-input resize-none font-mono text-[11px]"
                  rows={6}
                  value={draft.google_service_account ?? ''}
                  placeholder='{"type":"service_account","project_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"...@...iam.gserviceaccount.com",...}'
                  onChange={(e) => set('google_service_account', e.target.value || null)}
                />
                <p className="mt-2 font-sans text-[11px] text-ink/40">
                  Paste your Google service account credentials JSON. Share your spreadsheet with the client_email address as an Editor.
                </p>
              </div>
            </div>
          </div>

          {/* Test connection */}
          <div className="card p-6 md:p-8">
            <h2 className="font-serif text-[1.5rem] font-light text-primary">Test Connection</h2>
            <p className="mt-1 font-sans text-[12px] text-ink/45">Verify your Google integration is working. Saves your settings first.</p>
            <div className="mt-5 flex items-center gap-4">
              <Button variant="outline" onClick={async () => { await save(); testConnection(); }} disabled={testing}>
                {testing ? <Loader2 size={15} className="animate-spin" /> : <ExternalLink size={15} strokeWidth={1.5} />}
                {testing ? 'Testing…' : 'Run Test'}
              </Button>
              {testResult && (
                <span className={`font-sans text-[13px] ${testResult.includes('success') || testResult.includes('Success') ? 'text-success' : 'text-error'}`}>
                  {testResult}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-end border-t border-line pt-6">
          <Button onClick={save} disabled={saving} size="lg">
            {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} strokeWidth={1.5} /> : <Save size={16} strokeWidth={1.5} />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save All Changes'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
