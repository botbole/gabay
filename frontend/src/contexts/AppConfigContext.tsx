/**
 * AppConfigContext – loads TenantConfig from GET /api/v1/config on startup.
 *
 * Provides:
 *  - config: TenantConfig | null
 *  - isLoading: boolean
 *  - refresh(): void
 *
 * Also applies dynamic CSS custom properties (colors) and the synagogue
 * name to the document title.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { configApi, type TenantConfig } from '../api/client';

interface AppConfigContextValue {
  config: TenantConfig | null;
  isLoading: boolean;
  refresh: () => void;
}

const AppConfigContext = createContext<AppConfigContextValue>({
  config: null,
  isLoading: true,
  refresh: () => {},
});

export function AppConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTrigger = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    configApi
      .get()
      .then(data => {
        if (!cancelled) {
          setConfig(data);
          applyTheme(data);
        }
      })
      .catch(err => {
        console.warn('Failed to load app config:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => { cancelled = true; };
  }, [tick]); // re-run when tick changes (refresh)

  const refresh = () => {
    refreshTrigger.current += 1;
    setTick(refreshTrigger.current);
  };

  return (
    <AppConfigContext.Provider value={{ config, isLoading, refresh }}>
      {children}
    </AppConfigContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppConfig() {
  return useContext(AppConfigContext);
}

/** Apply TenantConfig colours as CSS custom properties on :root */
function applyTheme(cfg: TenantConfig) {
  const root = document.documentElement;
  if (cfg.color_primary)   root.style.setProperty('--color-indigo', cfg.color_primary);
  if (cfg.color_secondary) root.style.setProperty('--color-gold',   cfg.color_secondary);
  if (cfg.color_bg)        root.style.setProperty('--color-bg',     cfg.color_bg);
  if (cfg.synagogue_name)  document.title = cfg.synagogue_name + ' – גבאי';
}
