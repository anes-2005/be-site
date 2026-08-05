import { type ReactNode } from 'react';
import { navigate, useRouter } from '@/lib/router';
import { Logo } from '@/components/Logo';
import { useSettings } from '@/lib/settings-context';
import {
  LayoutDashboard, Layers, ClipboardList, Settings, ExternalLink,
  Eye, EyeOff, ArrowLeft, Image, BarChart3, Mail, BookOpen,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard },
  { label: 'Collections', to: '/admin/collections', icon: Layers },
  { label: 'Preorders', to: '/admin/preorders', icon: ClipboardList },
  { label: 'Media', to: '/admin/media', icon: Image },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Brand Story', to: '/admin/story', icon: BookOpen },
  { label: 'Google', to: '/admin/google', icon: Mail },
  { label: 'Site Settings', to: '/admin/settings', icon: Settings },
];

export function AdminLayout({ children, active }: { children: ReactNode; active: string }) {
  const route = useRouter();
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-bg-100 lg:flex">
      {/* Sidebar */}
      <aside className="sticky top-0 z-30 flex h-screen w-full shrink-0 flex-col border-b border-line bg-bg-50 lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-6 py-5 lg:block">
          <button onClick={() => navigate('/admin')} className="flex items-center">
            <Logo className="!h-7" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-ink/40 transition-colors hover:text-primary lg:hidden"
            aria-label="View site"
          >
            <ExternalLink size={18} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="mt-2 flex gap-1 overflow-x-auto px-3 pb-4 lg:mt-6 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.to || (item.to !== '/admin' && route.path.startsWith(item.to));
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 font-sans text-[12px] uppercase tracking-[0.16em] transition-all duration-200 lg:w-full ${
                  isActive
                    ? 'bg-primary text-bg'
                    : 'text-ink/55 hover:bg-bg-200 hover:text-primary'
                }`}
              >
                <Icon size={15} strokeWidth={1.5} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto hidden px-3 pb-6 lg:block">
          <div className="rounded-xl border border-line p-4">
            <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-ink/40">Site Status</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${settings.site_online ? 'bg-success' : 'bg-error'}`} />
              <span className="font-sans text-[12px] text-ink/70">
                {settings.site_online ? 'Online' : 'Offline'}
              </span>
            </div>
            <button
              onClick={() => navigate('/')}
              className="mt-3 flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.16em] text-ink/50 transition-colors hover:text-primary"
            >
              <ExternalLink size={13} strokeWidth={1.5} /> View Site
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1">
        {/* Mobile top bar */}
        <div className="flex items-center justify-between border-b border-line bg-bg-50 px-5 py-3 lg:hidden">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink/50">
            <ArrowLeft size={14} strokeWidth={1.5} /> Site
          </button>
          <div className="flex items-center gap-2 font-sans text-[11px] uppercase tracking-[0.18em] text-ink/50">
            {settings.site_online ? <Eye size={14} strokeWidth={1.5} /> : <EyeOff size={14} strokeWidth={1.5} />}
            {settings.site_online ? 'Online' : 'Offline'}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
