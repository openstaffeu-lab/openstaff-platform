import type { Metadata } from 'next';
import { AdminLayoutShell } from '@/components/AdminLayoutShell';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'OpenStaff Backoffice',
  description: 'OpenStaff operational administration workspace',
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
          <AdminLayoutShell>{children}</AdminLayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
