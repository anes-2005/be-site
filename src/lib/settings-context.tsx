import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSettings, DEFAULT_SETTINGS, type SiteSettings } from '@/lib/settings';

interface SettingsContextValue {
  settings: SiteSettings;
  loading: boolean;
  reload: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  loading: true,
  reload: async () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const s = await fetchSettings();
    setSettings(s);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, reload }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
