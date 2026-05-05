"use client";

import { CSSProperties } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileNavigation } from "./MobileNavigation";
import { useUiConfig } from "../../context/UiConfigContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { config } = useUiConfig();
  const shellStyle = {
    "--brand-navy": config.branding.primaryColor,
    "--brand-mint": config.branding.accentColor,
    "--brand-charcoal": config.branding.textColor,
    "--background": config.branding.backgroundColor,
  } as CSSProperties;

  return (
    <div className="brand-shell flex min-h-screen flex-col" style={shellStyle}>
      <Header />
      <div className="flex-1 pb-20 md:pb-0">{children}</div>
      <Footer />
      <MobileNavigation />
    </div>
  );
}
