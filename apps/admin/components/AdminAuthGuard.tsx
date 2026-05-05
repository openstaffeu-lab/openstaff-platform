"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const PUBLIC_PATHS = new Set(["/login", "/status", "/unauthorized"]);

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if (PUBLIC_PATHS.has(pathname)) {
      return;
    }

    if (loading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!isAdmin) {
      router.replace("/unauthorized");
    }
  }, [isAdmin, loading, pathname, router, user]);

  if (PUBLIC_PATHS.has(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-6 py-5 text-sm text-slate-300">
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <>{children}</>;
}
