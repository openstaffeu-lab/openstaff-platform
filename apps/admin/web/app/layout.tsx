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
  title: "OpenStaff | AI-Driven Procurement & Staffing Ecosystem",
  description:
    "RELU AI-powered procurement, staffing, contractor matching, and moderated workspaces for Industrial, Construction, and Tourism/HORECA sectors.",
  openGraph: {
    title: "OpenStaff | AI-Driven Procurement & Staffing Ecosystem",
    description:
      "RELU AI-powered procurement, staffing, contractor matching, and moderated workspaces for Industrial, Construction, and Tourism/HORECA sectors.",
    url: "https://openstaff.eu",
    siteName: "OpenStaff",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenStaff | AI-Driven Procurement & Staffing Ecosystem",
    description:
      "RELU AI-powered procurement, staffing, contractor matching, and moderated workspaces for Industrial, Construction, and Tourism/HORECA sectors.",
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
