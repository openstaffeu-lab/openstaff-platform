import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-rose-500/20 bg-slate-900 p-8">
        <div className="text-sm uppercase tracking-[0.2em] text-rose-300">Access denied</div>
        <h1 className="mt-3 text-3xl font-semibold">Administrator claim required</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          You are signed in, but this backoffice requires elevated Firebase access.
          Accepted claims are <code>admin: true</code> or <code>role: "SUPERADMIN"</code>.
        </p>
        <div className="mt-6">
          <Link
            href="/login"
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-500/40 hover:text-white"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
