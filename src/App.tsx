import { useRouter } from '@/lib/router';
import { SettingsProvider, useSettings } from '@/lib/settings-context';
import { LangProvider } from '@/lib/i18n';
import { useAdminAuth } from '@/lib/admin-auth';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { SiteOffline } from '@/components/SiteOffline';
import { TranslationPrompt } from '@/components/TranslationPrompt';
import { HomePage } from '@/pages/HomePage';
import { StorePage } from '@/pages/StorePage';
import { CollectionPage } from '@/pages/CollectionPage';
import { AboutPage } from '@/pages/AboutPage';
import { ConfirmationPage } from '@/pages/ConfirmationPage';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminCollections } from '@/pages/admin/AdminCollections';
import { AdminCollectionEditor } from '@/pages/admin/AdminCollectionEditor';
import { AdminPreordersPage } from '@/pages/admin/AdminPreordersPage';
import { AdminSiteSettings } from '@/pages/admin/AdminSiteSettings';
import { AdminMediaLibrary } from '@/pages/admin/AdminMediaLibrary';
import { AdminAnalyticsDashboard } from '@/pages/admin/AdminAnalyticsDashboard';
import { AdminGoogleIntegrations } from '@/pages/admin/AdminGoogleIntegrations';
import { AdminBrandStory } from '@/pages/admin/AdminBrandStory';
import { AdminIdeasPage } from '@/pages/admin/AdminIdeasPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const ADMIN_PREFIX = '/admin';

function AdminGate({ children }: { children: React.ReactNode }) {
  const { authenticated, loading } = useAdminAuth();
  if (loading) return null;
  if (!authenticated) return <AdminLogin />;
  return <>{children}</>;
}

function AppContent() {
  const route = useRouter();
  const { settings, loading } = useSettings();

  // Admin routes render without the public nav/footer, behind the auth gate.
  if (route.path.startsWith(ADMIN_PREFIX)) {
    return (
      <AdminGate>
        {route.path === '/admin' && <AdminOverview />}
        {route.path === '/admin/collections' && <AdminCollections />}
        {route.path === '/admin/collection/:id' && <AdminCollectionEditor id={route.params.id} />}
        {route.path === '/admin/preorders' && <AdminPreordersPage />}
        {route.path === '/admin/settings' && <AdminSiteSettings />}
        {route.path === '/admin/media' && <AdminMediaLibrary />}
        {route.path === '/admin/analytics' && <AdminAnalyticsDashboard />}
        {route.path === '/admin/google' && <AdminGoogleIntegrations />}
        {route.path === '/admin/story' && <AdminBrandStory />}
        {route.path === '/admin/ideas' && <AdminIdeasPage />}
      </AdminGate>
    );
  }

  // Site offline gate — admin is always accessible.
  if (!loading && !settings.site_online) return <SiteOffline />;

  let page: React.ReactNode;
  switch (route.path) {
    case '/':
      page = <HomePage />;
      break;
    case '/store':
      page = <StorePage />;
      break;
    case '/collection/:slug':
      page = <CollectionPage slug={route.params.slug} />;
      break;
    case '/about':
      page = <AboutPage />;
      break;
    case '/confirmation':
      page = <ConfirmationPage />;
      break;
    case '/not-found':
      page = <NotFoundPage />;
      break;
    default:
      page = <NotFoundPage />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <div className="flex-1">{page}</div>
      <Footer />
      <TranslationPrompt />
      <WhatsAppButton />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <LangProvider>
        <AppContent />
      </LangProvider>
    </SettingsProvider>
  );
}

export default App;
