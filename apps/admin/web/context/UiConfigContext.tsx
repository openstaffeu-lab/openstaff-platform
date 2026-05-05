"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiRequest } from "../lib/api";
import { DEFAULT_PUBLIC_UI_CONFIG, PublicUiConfig } from "../lib/ui-config";

type UiConfigContextValue = {
  config: PublicUiConfig;
  isLoading: boolean;
};

const UiConfigContext = createContext<UiConfigContextValue>({
  config: DEFAULT_PUBLIC_UI_CONFIG,
  isLoading: true,
});

export function UiConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicUiConfig>(DEFAULT_PUBLIC_UI_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadConfig() {
      try {
        const nextConfig = await apiRequest<PublicUiConfig>("/ui-config");

        if (!cancelled) {
          setConfig(nextConfig);
        }
      } catch {
        if (!cancelled) {
          setConfig(DEFAULT_PUBLIC_UI_CONFIG);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      config,
      isLoading,
    }),
    [config, isLoading],
  );

  return (
    <UiConfigContext.Provider value={value}>{children}</UiConfigContext.Provider>
  );
}

export function useUiConfig() {
  return useContext(UiConfigContext);
}
