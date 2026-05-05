import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { UiConfigProvider } from "../context/UiConfigContext";
import { MessagingDock } from "../components/messaging/MessagingDock";
import { AppShell } from "../components/layout/AppShell";
import { StatusConsoleReporter } from "../components/StatusConsoleReporter";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "OpenStaff",
  description: "The Structure for Global Work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${montserrat.variable} bg-transparent text-brand-charcoal antialiased`}
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
