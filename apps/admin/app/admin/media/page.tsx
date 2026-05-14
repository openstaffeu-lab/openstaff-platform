'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchApiJson } from '@/lib/api';

type MediaItem = {
  id: string;
  url: string;
  type: string;
  alt: string | null;
  status: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
  } | null;
};

type DocumentItem = {
  id: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
  } | null;
};

type LoadState = 'loading' | 'success' | 'unauthorized' | 'error';
type QueueMode = 'media' | 'documents';

export default function AdminMediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [documentItems, setDocumentItems] = useState<DocumentItem[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<QueueMode>('media');

  useEffect(() => {
    let mounted = true;

    async function loadQueues() {
      setState('loading');
      setMessage(null);

      const [mediaResult, documentResult] = await Promise.all([
        fetchApiJson<MediaItem[]>('/admin/public-post-media'),
        fetchApiJson<DocumentItem[]>('/admin/public-post-documents'),
      ]);

      if (!mounted) {
        return;
      }

      if (!mediaResult.ok) {
        setState(mediaResult.kind);
        setMessage(mediaResult.message);
        setMediaItems([]);
        setDocumentItems([]);
        return;
      }

      if (!documentResult.ok) {
        setState(documentResult.kind);
        setMessage(documentResult.message);
        setMediaItems([]);
        setDocumentItems([]);
        return;
      }

      const mediaData = mediaResult.data;
      const documentData = documentResult.data;

      setMediaItems(Array.isArray(mediaData) ? mediaData : []);
      setDocumentItems(Array.isArray(documentData) ? documentData : []);
      setState('success');
    }

    void loadQueues();

    return () => {
      mounted = false;
    };
  }, []);

  const pendingCount = useMemo(
    () =>
      mediaItems.filter((item) => item.status === 'PENDING').length +
      documentItems.filter((item) => item.status === 'PENDING').length,
    [documentItems, mediaItems],
  );

  async function updateMediaStatus(id: string, status: string) {
    const result = await fetchApiJson<MediaItem>(`/admin/public-post-media/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMediaItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status: result.data.status } : item)),
    );
    setMessage(`Media ${status.toLowerCase()} successfully.`);
  }

  async function updateDocumentStatus(id: string, status: string) {
    const result = await fetchApiJson<DocumentItem>(`/admin/public-post-documents/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setDocumentItems((current) =>
      current.map((item) => (item.id === id ? { ...item, status: result.data.status } : item)),
    );
    setMessage(`Document ${status.toLowerCase()} successfully.`);
  }

  const visibleItems = mode === 'media' ? mediaItems : documentItems;

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              OpenStaff Asset Moderation
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Public Media & Document Queue</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Review uploaded images, videos, and documents before they become visible on the live
              public feed.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Pending Assets" value={String(pendingCount)} />
            <MetricCard label="Media Files" value={String(mediaItems.length)} />
            <MetricCard label="Documents" value={String(documentItems.length)} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <QueueButton active={mode === 'media'} onClick={() => setMode('media')}>
            Media
          </QueueButton>
          <QueueButton active={mode === 'documents'} onClick={() => setMode('documents')}>
            Documents
          </QueueButton>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === 'loading' ? <ShellNotice tone="neutral" message="Loading moderation assets..." /> : null}
        {state === 'unauthorized' ? (
          <ShellNotice tone="warning" message={message ?? 'Authentication is required.'} />
        ) : null}
        {state === 'error' ? (
          <ShellNotice tone="danger" message={message ?? 'The asset moderation queue could not load.'} />
        ) : null}

        {state === 'success' && visibleItems.length === 0 ? (
          <ShellNotice tone="neutral" message="No assets are waiting in this queue." />
        ) : null}

        {state === 'success' && mode === 'media' ? (
          <div className="mt-8 grid gap-5">
            {mediaItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge label={item.type} tone="info" />
                      <Badge label={item.status} tone={statusTone(item.status)} />
                    </div>
                    <h2 className="mt-4 break-all text-lg font-semibold text-cyan-100">{item.url}</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.post?.title ?? 'Unlinked post'} · {formatDate(item.createdAt)}
                    </p>
                    <p className="mt-4 text-sm text-slate-300">
                      <strong>Alt text:</strong> {item.alt || 'Not provided'}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 xl:w-56">
                    <ActionButton label="Approve" onClick={() => void updateMediaStatus(item.id, 'APPROVED')} tone="success" />
                    <ActionButton label="Reject" onClick={() => void updateMediaStatus(item.id, 'REJECTED')} tone="danger" />
                    <ActionButton label="Flag" onClick={() => void updateMediaStatus(item.id, 'FLAGGED')} tone="warning" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        {state === 'success' && mode === 'documents' ? (
          <div className="mt-8 grid gap-5">
            {documentItems.map((item) => (
              <article key={item.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge label="DOCUMENT" tone="info" />
                      <Badge label={item.status} tone={statusTone(item.status)} />
                    </div>
                    <h2 className="mt-4 break-all text-lg font-semibold text-cyan-100">{item.title}</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      {item.post?.title ?? 'Unlinked post'} · {formatDate(item.createdAt)}
                    </p>
                    <p className="mt-4 text-sm text-slate-300">
                      <strong>File:</strong> {item.fileName} · {item.mimeType} ·{' '}
                      {Math.max(1, Math.round(item.sizeBytes / 1024))} KB
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-3 xl:w-56">
                    <ActionButton label="Approve" onClick={() => void updateDocumentStatus(item.id, 'APPROVED')} tone="success" />
                    <ActionButton label="Reject" onClick={() => void updateDocumentStatus(item.id, 'REJECTED')} tone="danger" />
                    <ActionButton label="Flag" onClick={() => void updateDocumentStatus(item.id, 'FLAGGED')} tone="warning" />
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/80 px-5 py-4">
      <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function QueueButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? 'bg-cyan-300 text-slate-950'
          : 'border border-slate-700 bg-slate-950 text-slate-200'
      }`}
    >
      {children}
    </button>
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

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'info' | 'success' | 'warning' | 'danger';
}) {
  const styles =
    tone === 'success'
      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
        : tone === 'danger'
          ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
          : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${styles}`}>
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

function statusTone(status: string): 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'APPROVED') {
    return 'success';
  }

  if (status === 'REJECTED') {
    return 'danger';
  }

  if (status === 'FLAGGED') {
    return 'warning';
  }

  return 'info';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
