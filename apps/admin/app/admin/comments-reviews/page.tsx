'use client';

import { useEffect, useState } from 'react';
import { fetchApiJson } from '@/lib/api';

type CommentItem = {
  id: string;
  authorName: string;
  comment: string;
  status: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
  } | null;
};

type ReviewItem = {
  id: string;
  authorName: string;
  review: string;
  rating: number | null;
  status: string;
  createdAt: string;
  post?: {
    id: string;
    title: string;
  } | null;
};

type FeedbackPayload = {
  comments: CommentItem[];
  reviews: ReviewItem[];
};

type LoadState = 'loading' | 'success' | 'unauthorized' | 'error';

export default function AdminCommentsReviewsPage() {
  const [payload, setPayload] = useState<FeedbackPayload>({ comments: [], reviews: [] });
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFeedback() {
      setState('loading');
      setMessage(null);

      const result = await fetchApiJson<FeedbackPayload>('/admin/public-feedback');

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setState(result.kind);
        setMessage(result.message);
        setPayload({ comments: [], reviews: [] });
        return;
      }

      setPayload(result.data);
      setState('success');
    }

    void loadFeedback();

    return () => {
      mounted = false;
    };
  }, []);

  async function updateCommentStatus(id: string, status: string) {
    const result = await fetchApiJson<CommentItem>(`/admin/public-comments/${id}/status`, {
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

    setPayload((current) => ({
      ...current,
      comments: current.comments.map((item) =>
        item.id === id ? { ...item, status: result.data.status } : item,
      ),
    }));
    setMessage(`Comment ${status.toLowerCase()} successfully.`);
  }

  async function updateReviewStatus(id: string, status: string) {
    const result = await fetchApiJson<ReviewItem>(`/admin/public-reviews/${id}/status`, {
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

    setPayload((current) => ({
      ...current,
      reviews: current.reviews.map((item) =>
        item.id === id ? { ...item, status: result.data.status } : item,
      ),
    }));
    setMessage(`Review ${status.toLowerCase()} successfully.`);
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Public Trust Signals
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Comments & Reviews</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Moderate public feedback before it becomes a visible reputation signal across the
          marketplace.
        </p>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === 'loading' ? <ShellNotice tone="neutral" message="Loading comments and reviews..." /> : null}
        {state === 'unauthorized' ? (
          <ShellNotice tone="warning" message={message ?? 'Authentication is required.'} />
        ) : null}
        {state === 'error' ? (
          <ShellNotice tone="danger" message={message ?? 'The feedback moderation queue could not load.'} />
        ) : null}

        {state === 'success' ? (
          <div className="mt-8 grid gap-8 xl:grid-cols-2">
            <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <h2 className="text-xl font-semibold text-white">Comments</h2>
              <div className="mt-5 grid gap-4">
                {payload.comments.map((item) => (
                  <FeedbackCard
                    key={item.id}
                    title={item.post?.title ?? 'Unlinked post'}
                    author={item.authorName}
                    body={item.comment}
                    status={item.status}
                    date={item.createdAt}
                    actions={[
                      { label: 'Approve', onClick: () => void updateCommentStatus(item.id, 'PUBLISHED'), tone: 'success' },
                      { label: 'Reject', onClick: () => void updateCommentStatus(item.id, 'REJECTED'), tone: 'danger' },
                      { label: 'Flag', onClick: () => void updateCommentStatus(item.id, 'FLAGGED'), tone: 'warning' },
                    ]}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
              <h2 className="text-xl font-semibold text-white">Reviews</h2>
              <div className="mt-5 grid gap-4">
                {payload.reviews.map((item) => (
                  <FeedbackCard
                    key={item.id}
                    title={item.post?.title ?? 'Unlinked post'}
                    author={`${item.authorName}${typeof item.rating === 'number' ? ` · ${item.rating}/5` : ''}`}
                    body={item.review}
                    status={item.status}
                    date={item.createdAt}
                    actions={[
                      { label: 'Approve', onClick: () => void updateReviewStatus(item.id, 'PUBLISHED'), tone: 'success' },
                      { label: 'Reject', onClick: () => void updateReviewStatus(item.id, 'REJECTED'), tone: 'danger' },
                      { label: 'Flag', onClick: () => void updateReviewStatus(item.id, 'FLAGGED'), tone: 'warning' },
                    ]}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function FeedbackCard({
  title,
  author,
  body,
  status,
  date,
  actions,
}: {
  title: string;
  author: string;
  body: string;
  status: string;
  date: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    tone: 'success' | 'danger' | 'warning';
  }>;
}) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-cyan-100">{title}</div>
          <div className="mt-1 text-xs text-slate-500">
            {author} · {new Date(date).toLocaleString()}
          </div>
        </div>
        <Badge label={status} tone={statusTone(status)} />
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-300">{body}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        {actions.map((action) => (
          <ActionButton
            key={action.label}
            label={action.label}
            onClick={action.onClick}
            tone={action.tone}
          />
        ))}
      </div>
    </article>
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
  tone: 'success' | 'warning' | 'danger' | 'info';
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
  if (status === 'PUBLISHED') {
    return 'success';
  }

  if (status === 'FLAGGED' || status === 'PENDING_REVIEW') {
    return 'warning';
  }

  if (status === 'REJECTED') {
    return 'danger';
  }

  return 'info';
}
