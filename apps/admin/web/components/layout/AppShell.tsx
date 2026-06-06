"use client";

import { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileNavigation } from "./MobileNavigation";
import { useUiConfig } from "../../context/UiConfigContext";
import { useAuth } from "../../context/AuthContext";
import { resolveShellMode } from "../../lib/authenticated-navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config } = useUiConfig();
  const { isAuthenticated, isReady } = useAuth();
  const pathname = usePathname();
  const mode = resolveShellMode({ pathname, isAuthenticated, isReady });
  const shellStyle = {
    "--brand-navy": config.branding.primaryColor,
    "--brand-mint": config.branding.accentColor,
    "--brand-charcoal": config.branding.textColor,
    "--background": config.branding.backgroundColor,
  } as CSSProperties;

  return (
    <div
      className="brand-shell flex min-h-screen flex-col"
      style={shellStyle}
      data-shell-mode={mode.toLowerCase()}
    >
      <Header mode={mode} />
      <div
        className={`flex-1 ${
          mode === "PUBLIC" || mode === "AUTHENTICATED" ? "pb-20 md:pb-0" : ""
        }`}
      >
        {children}
      </div>
      {mode === "PUBLIC" ? <Footer /> : null}
      <MobileNavigation mode={mode} />
    </div>
  );
}
