import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASS JOBS - Super Admin",
  description: "ASS JOBS Super Admin Control Center",
};

const menu = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Projects", path: "/projects" },
  { name: "Contracts", path: "/contracts" },
  { name: "Professionals", path: "/professionals" },
  { name: "Supervisors", path: "/supervisors" },
  { name: "Financial", path: "/financial" },
  { name: "Services", path: "/services" },
  { name: "Countries & VAT", path: "/countries-vat" },
  { name: "AI Control", path: "/ai-control" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white">
        <div className="flex min-h-screen">
          <aside className="hidden md:flex md:w-72 md:flex-col border-r border-slate-800 bg-slate-900 p-6">
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-cyan-400">ASS JOBS</h2>
              <p className="mt-2 text-sm text-slate-400">Super Admin Control Center</p>
            </div>

            <nav className="space-y-2">
              {menu.map((item) => (
                <Link key={item.name} href={item.path}>
                  <div className="cursor-pointer rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-slate-800 hover:text-white">
                    {item.name}
                  </div>
                </Link>
              ))}
            </nav>

            <div className="mt-auto rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="text-sm text-cyan-300">System status</div>
              <div className="mt-2 text-xl font-semibold">Operational</div>
              <div className="mt-1 text-sm text-slate-300">All core services running</div>
            </div>
          </aside>

          <div className="flex min-h-screen flex-1 flex-col">
            <header className="border-b border-slate-800 bg-slate-950/90 px-6 py-5 backdrop-blur md:px-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">
                    European workforce platform
                  </div>
                  <h1 className="mt-2 text-2xl font-semibold md:text-3xl">
                    Control Center Platformă
                  </h1>
                </div>

                <div className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950">
                  Super Admin
                </div>
              </div>
            </header>

            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}