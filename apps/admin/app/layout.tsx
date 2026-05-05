import type { Metadata } from 'next';
import { AdminLayoutShell } from '@/components/AdminLayoutShell';
import { StatusConsoleReporter } from '@/components/StatusConsoleReporter';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenStaff - Super Admin',
  description: 'OpenStaff super admin control center',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white">
        <AuthProvider>
          <StatusConsoleReporter />
          <AdminLayoutShell>{children}</AdminLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
