'use client';

import { useEffect, useState } from 'react';
import { fetchApiJson } from '@/lib/api';

type AdminPost = {
  id: string;
  type: string;
  title: string;
  ownerName: string;
  ownerType: string;
  domain: string;
  location: string;
  status: string;
  visibility: string;
  value: string;
  createdAt: string;
  media?: Array<{ id: string }>;
  externalLinks?: Array<{ id: string }>;
  comments?: Array<{ id: string }>;
  reviews?: Array<{ id: string }>;
  privateConversations?: Array<{ id: string }>;
};

type LoadState = 'loading' | 'success' | 'unauthorized' | 'error';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadPosts() {
      setState('loading');
      setMessage(null);

      const result = await fetchApiJson<AdminPost[]>('/admin/public-posts');

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setState(result.kind);
        setMessage(result.message);
        setPosts([]);
        return;
      }

      setPosts(Array.isArray(result.data) ? result.data : []);
      setState('success');
    }

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Marketplace Moderation
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Public Posts</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Review public listings for projects, professionals, and subcontractor pools before
          deeper media, link, messaging, and feedback moderation.
        </p>

        {state === 'loading' ? <ShellNotice tone="neutral" message="Loading public posts..." /> : null}
        {state === 'unauthorized' ? (
          <ShellNotice tone="warning" message={message ?? 'Authentication is required.'} />
        ) : null}
        {state === 'error' ? (
          <ShellNotice tone="danger" message={message ?? 'The admin posts module could not load.'} />
        ) : null}

        {state === 'success' ? (
          <div className="mt-8 grid gap-5 xl:grid-cols-2">
            {posts.map((post) => (
              <article key={post.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="info" label={post.type} />
                  <Badge tone="success" label={post.visibility} />
                  <Badge tone="neutral" label={post.status} />
                </div>

                <h2 className="mt-4 text-xl font-semibold text-cyan-100">{post.title}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {post.ownerName} · {post.ownerType}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Stat label="Domain" value={post.domain} />
                  <Stat label="Location" value={post.location} />
                  <Stat label="Value" value={post.value} />
                  <Stat label="Created" value={formatDate(post.createdAt)} />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-5">
                  <Counter label="Media" value={post.media?.length ?? 0} />
                  <Counter label="Links" value={post.externalLinks?.length ?? 0} />
                  <Counter label="Chats" value={post.privateConversations?.length ?? 0} />
                  <Counter label="Comments" value={post.comments?.length ?? 0} />
                  <Counter label="Reviews" value={post.reviews?.length ?? 0} />
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-4 text-center">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-2 text-sm text-slate-200">{value}</div>
    </div>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: 'info' | 'success' | 'neutral';
}) {
  const styles =
    tone === 'info'
      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
      : tone === 'success'
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
        : 'border-slate-700 bg-slate-900 text-slate-300';

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

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}
