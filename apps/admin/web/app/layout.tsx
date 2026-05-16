import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { UiConfigProvider } from "../context/UiConfigContext";
import { MessagingDock } from "../components/messaging/MessagingDock";
import { AppShell } from "../components/layout/AppShell";
import { StatusConsoleReporter } from "../components/StatusConsoleReporter";

export const metadata: Metadata = {
  metadataBase: new URL("https://openstaff.eu"),
  title: "OpenStaff",
  description: "The Structure for Global Work.",
  openGraph: {
    title: "OpenStaff",
    description: "The Structure for Global Work.",
    url: "https://openstaff.eu",
    siteName: "OpenStaff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenStaff",
    description: "The Structure for Global Work.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-transparent text-brand-charcoal antialiased"
        style={
          {
            "--font-inter": '"Segoe UI", sans-serif',
            "--font-montserrat": '"Trebuchet MS", "Segoe UI", sans-serif',
          } as CSSProperties
        }
      >
        <AuthProvider>
          <UiConfigProvider>
            <StatusConsoleReporter />
            <AppShell>{children}</AppShell>
            <MessagingDock />
          </UiConfigProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
