'use client';

import { useEffect, useState } from 'react';
import { fetchApiJson } from '@/lib/api';

type ExternalLinkRecord = {
  id: string;
  url: string;
  normalizedUrl: string;
  submittedBy: string;
  securityStatus: string;
  reasonsJson: string[] | string;
  sourcePost?: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
};

type LoadState = 'loading' | 'success' | 'unauthorized' | 'error';

export default function ExternalLinksAdminPage() {
  const [links, setLinks] = useState<ExternalLinkRecord[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadLinks() {
      setState('loading');
      setMessage(null);

      const result = await fetchApiJson<ExternalLinkRecord[]>('/admin/external-links');

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setState(result.kind);
        setMessage(result.message);
        setLinks([]);
        return;
      }

      setLinks(Array.isArray(result.data) ? result.data : []);
      setState('success');
    }

    void loadLinks();

    return () => {
      mounted = false;
    };
  }, []);

  async function updateStatus(id: string, securityStatus: string) {
    const result = await fetchApiJson<ExternalLinkRecord>(`/admin/external-links/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ securityStatus }),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setLinks((current) =>
      current.map((item) =>
        item.id === id ? { ...item, securityStatus: result.data.securityStatus } : item,
      ),
    );
    setMessage(`External link ${securityStatus.toLowerCase()} successfully.`);
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              OpenStaff Trust & Safety
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white">
              External Link Approval Queue
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Review submitted external URLs attached to public marketplace posts before they
              become trusted outbound references.
            </p>
          </div>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === 'loading' ? <ShellNotice tone="neutral" message="Loading external links..." /> : null}
        {state === 'unauthorized' ? (
          <ShellNotice tone="warning" message={message ?? 'Authentication is required.'} />
        ) : null}
        {state === 'error' ? (
          <ShellNotice tone="danger" message={message ?? 'The external links queue could not load.'} />
        ) : null}

        {state === 'success' ? (
          <div className="mt-8 grid gap-5">
            {links.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <StatusChip label={item.securityStatus} tone={statusTone(item.securityStatus)} />
                    </div>

                    <h2 className="mt-4 break-all text-lg font-semibold text-cyan-100">
                      {item.url}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.sourcePost?.title ?? 'Unknown source post'} · submitted by {item.submittedBy}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {item.normalizedUrl}
                    </p>

                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                        Security reasons
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {normalizeReasons(item.reasonsJson).map((reason) => (
                          <span
                            key={reason}
                            className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 xl:w-48">
                    <ActionButton label="Approve" onClick={() => void updateStatus(item.id, 'APPROVED')} tone="success" />
                    <ActionButton label="Reject" onClick={() => void updateStatus(item.id, 'REJECTED')} tone="danger" />
                    <ActionButton label="Flag/Pending" onClick={() => void updateStatus(item.id, 'PENDING')} tone="warning" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function ActionButton({
  label,
  onClick,
  tone,
}: {
  label: string;
  onClick: () => void;
  tone: 'success' | 'danger' | 'warning';
}) {
  const styles =
    tone === 'success'
      ? 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
      : tone === 'danger'
        ? 'bg-rose-400 text-slate-950 hover:bg-rose-300'
        : 'bg-amber-300 text-slate-950 hover:bg-amber-200';

  return (
    <button type="button" onClick={onClick} className={`rounded-2xl px-4 py-3 text-sm font-black transition ${styles}`}>
      {label}
    </button>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  const className =
    tone === 'success'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : tone === 'danger'
        ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
        : 'border-amber-400/20 bg-amber-400/10 text-amber-200';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${className}`}>
      {label}
    </span>
  );
}

function ShellNotice({
  message,
  tone,
}: {
  message: string;
  tone: 'neutral' | 'warning' | 'danger';
}) {
  const styles =
    tone === 'warning'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      : tone === 'danger'
        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
        : 'border-slate-800 bg-slate-950/80 text-slate-300';

  return <div className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${styles}`}>{message}</div>;
}

function normalizeReasons(input: string[] | string) {
  if (Array.isArray(input)) {
    return input;
  }

  try {
    const parsed = JSON.parse(input);
    return Array.isArray(parsed) ? parsed : [input];
  } catch {
    return [input];
  }
}

function statusTone(status: string): 'success' | 'warning' | 'danger' {
  if (status === 'APPROVED') {
    return 'success';
  }

  if (status === 'REJECTED') {
    return 'danger';
  }

  return 'warning';
}
