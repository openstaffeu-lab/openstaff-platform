'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildApiUrl, fetchApiJson } from '@/lib/api';

type AdminPost = {
  id: string;
  slug?: string;
  type: string;
  title: string;
  summary?: string | null;
  ownerName: string;
  ownerType: string;
  domain: string;
  location: string;
  status: string;
  moderationStatus?: string;
  visibility?: string;
  value: string;
  currencyCode?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  certifications?: string;
  languageCodes?: string[];
  naceCodes?: string[];
  createdAt: string;
  media?: Array<{ id: string; role?: string; status?: string }>;
  documents?: Array<{ id: string }>;
  externalLinks?: Array<{ id: string; securityStatus?: string }>;
  comments?: Array<{ id: string }>;
  reviews?: Array<{ id: string }>;
  privateConversations?: Array<{ id: string }>;
};

type LoadState = 'loading' | 'success' | 'unauthorized' | 'error';

const STATUS_OPTIONS = ['PENDING', 'LIVE', 'OFFLINE', 'CLOSED', 'WARRANTY'];
const MODERATION_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'];
const VISIBILITY_OPTIONS = ['PUBLIC', 'PRIVATE'];

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [state, setState] = useState<LoadState>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    search: '',
  });
  const [drafts, setDrafts] = useState<Record<string, { status: string; moderationStatus: string; visibility: string }>>(
    {},
  );

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

      const nextPosts = Array.isArray(result.data) ? result.data : [];
      setPosts(nextPosts);
      setDrafts(
        Object.fromEntries(
          nextPosts.map((post) => [
            post.id,
            {
              status: post.status || 'PENDING',
              moderationStatus: post.moderationStatus || 'PENDING',
              visibility: post.visibility || 'PUBLIC',
            },
          ]),
        ),
      );
      setState('success');
    }

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (filters.type !== 'ALL' && post.type !== filters.type) {
        return false;
      }

      if (filters.status !== 'ALL' && post.status !== filters.status) {
        return false;
      }

      if (filters.search.trim()) {
        const needle = filters.search.trim().toLowerCase();
        const haystack = [
          post.title,
          post.ownerName,
          post.ownerType,
          post.domain,
          post.location,
          post.slug || '',
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(needle)) {
          return false;
        }
      }

      return true;
    });
  }, [filters, posts]);

  async function savePost(postId: string) {
    const draft = drafts[postId];

    if (!draft) {
      return;
    }

    setSavingId(postId);
    setMessage(null);

    const result = await fetchApiJson<AdminPost>(`/admin/public-posts/${postId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(draft),
    });

    setSavingId(null);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              status: result.data.status,
              moderationStatus: result.data.moderationStatus,
              visibility: result.data.visibility,
            }
          : post,
      ),
    );
    setMessage(`Updated moderation state for "${result.data.title}".`);
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
              OpenStaff Marketplace Moderation
            </p>
            <h1 className="mt-3 text-3xl font-semibold">Public Posts</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
              Moderate active projects, professionals, and subcontracting pools. Control public
              visibility, lifecycle status, and approval before traffic reaches the live
              marketplace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="Total Posts" value={String(posts.length)} />
            <MetricCard
              label="Pending Review"
              value={String(posts.filter((post) => post.moderationStatus === 'PENDING').length)}
            />
            <MetricCard
              label="Live Now"
              value={String(posts.filter((post) => post.status === 'LIVE').length)}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-3 xl:grid-cols-[180px_180px_minmax(0,1fr)]">
          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-black uppercase tracking-[0.2em] text-slate-500">Type</span>
            <select
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({ ...current, type: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            >
              <option value="ALL">All types</option>
              <option value="PROJECT">Active Projects & Requests</option>
              <option value="PROFESSIONAL">Professionals</option>
              <option value="SUBCONTRACTOR_POOL">Subcontracting pools</option>
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-black uppercase tracking-[0.2em] text-slate-500">Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-slate-300">
            <span className="font-black uppercase tracking-[0.2em] text-slate-500">Search</span>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              placeholder="Title, owner, slug, domain..."
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        {message ? (
          <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            {message}
          </div>
        ) : null}

        {state === 'loading' ? <ShellNotice tone="neutral" message="Loading public posts..." /> : null}
        {state === 'unauthorized' ? (
          <ShellNotice tone="warning" message={message ?? 'Authentication is required.'} />
        ) : null}
        {state === 'error' ? (
          <ShellNotice tone="danger" message={message ?? 'The admin posts module could not load.'} />
        ) : null}

        {state === 'success' && filteredPosts.length === 0 ? (
          <ShellNotice tone="neutral" message="No marketplace posts match the current filters." />
        ) : null}

        {state === 'success' ? (
          <div className="mt-8 grid gap-5">
            {filteredPosts.map((post) => {
              const draft = drafts[post.id] ?? {
                status: post.status || 'PENDING',
                moderationStatus: post.moderationStatus || 'PENDING',
                visibility: post.visibility || 'PUBLIC',
              };

              const heroMedia =
                post.media?.find((item) => item.role === 'BANNER') ?? post.media?.[0] ?? null;

              return (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/80"
                >
                  {heroMedia ? (
                    <div className="border-b border-slate-800 bg-slate-900 px-6 py-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                      Featured media attached · {heroMedia.status ?? 'PENDING'}
                    </div>
                  ) : null}

                  <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1.7fr)_320px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone="info" label={post.type} />
                        <Badge tone={statusTone(post.status)} label={post.status} />
                        <Badge tone={moderationTone(post.moderationStatus)} label={post.moderationStatus || 'PENDING'} />
                        <Badge tone="neutral" label={post.visibility || 'PUBLIC'} />
                      </div>

                      <h2 className="mt-4 text-2xl font-semibold text-cyan-100">{post.title}</h2>
                      <p className="mt-2 text-sm text-slate-400">
                        {post.ownerName} · {post.ownerType}
                      </p>

                      {post.summary ? (
                        <p className="mt-4 text-sm leading-7 text-slate-300">{post.summary}</p>
                      ) : null}

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <Stat label="Domain" value={post.domain || 'General'} />
                        <Stat label="Location" value={post.location || 'Unspecified'} />
                        <Stat label="Budget / Value" value={formatValue(post)} />
                        <Stat label="Created" value={formatDate(post.createdAt)} />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-6">
                        <Counter label="Media" value={post.media?.length ?? 0} />
                        <Counter label="Docs" value={post.documents?.length ?? 0} />
                        <Counter label="Links" value={post.externalLinks?.length ?? 0} />
                        <Counter label="Chats" value={post.privateConversations?.length ?? 0} />
                        <Counter label="Comments" value={post.comments?.length ?? 0} />
                        <Counter label="Reviews" value={post.reviews?.length ?? 0} />
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {(post.naceCodes ?? []).slice(0, 3).map((code) => (
                          <MicroChip key={`nace-${post.id}-${code}`} label={`NACE ${code}`} />
                        ))}
                        {(post.languageCodes ?? []).slice(0, 3).map((code) => (
                          <MicroChip key={`lang-${post.id}-${code}`} label={code} />
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-400">
                        {post.slug ? <span>Slug: {post.slug}</span> : null}
                        {post.certifications ? <span>Certifications: {post.certifications}</span> : null}
                        {post.externalLinks?.some((item) => item.securityStatus === 'APPROVED') ? (
                          <span>Approved external link available</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                      <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">
                        Moderation Controls
                      </div>

                      <div className="mt-4 grid gap-4">
                        <AdminSelect
                          label="Lifecycle status"
                          value={draft.status}
                          options={STATUS_OPTIONS}
                          onChange={(value) =>
                            setDrafts((current) => ({
                              ...current,
                              [post.id]: { ...draft, status: value },
                            }))
                          }
                        />

                        <AdminSelect
                          label="Post approval"
                          value={draft.moderationStatus}
                          options={MODERATION_OPTIONS}
                          onChange={(value) =>
                            setDrafts((current) => ({
                              ...current,
                              [post.id]: { ...draft, moderationStatus: value },
                            }))
                          }
                        />

                        <AdminSelect
                          label="Visibility"
                          value={draft.visibility}
                          options={VISIBILITY_OPTIONS}
                          onChange={(value) =>
                            setDrafts((current) => ({
                              ...current,
                              [post.id]: { ...draft, visibility: value },
                            }))
                          }
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => void savePost(post.id)}
                        disabled={savingId === post.id}
                        className="mt-5 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {savingId === post.id ? 'Saving...' : 'Save Status'}
                      </button>

                      <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-sm text-slate-300">
                        <div className="font-black uppercase tracking-[0.18em] text-slate-500">
                          Fast links
                        </div>
                        <div className="mt-3 grid gap-2">
                          <a
                            href="/admin/media"
                            className="rounded-2xl border border-slate-800 px-3 py-2 text-cyan-100 no-underline transition hover:border-cyan-400/40 hover:bg-slate-900"
                          >
                            Review media queue
                          </a>
                          <a
                            href="/admin/external-links"
                            className="rounded-2xl border border-slate-800 px-3 py-2 text-cyan-100 no-underline transition hover:border-cyan-400/40 hover:bg-slate-900"
                          >
                            Review external links
                          </a>
                          {heroMedia ? (
                            <a
                              href={buildApiUrl(`/public-posts/media/${heroMedia.id}`)}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-2xl border border-slate-800 px-3 py-2 text-cyan-100 no-underline transition hover:border-cyan-400/40 hover:bg-slate-900"
                            >
                              Open media asset
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
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
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const styles =
    tone === 'info'
      ? 'border-cyan-400/20 bg-cyan-400/10 text-cyan-200'
      : tone === 'success'
        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
        : tone === 'warning'
          ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
          : tone === 'danger'
            ? 'border-rose-400/20 bg-rose-400/10 text-rose-200'
            : 'border-slate-700 bg-slate-900 text-slate-300';

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${styles}`}>
      {label}
    </span>
  );
}

function MicroChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
      {label}
    </span>
  );
}

function AdminSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
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

function statusTone(status: string | undefined): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'LIVE') {
    return 'success';
  }

  if (status === 'PENDING' || status === 'WARRANTY') {
    return 'warning';
  }

  if (status === 'OFFLINE' || status === 'CLOSED') {
    return 'danger';
  }

  return 'neutral';
}

function moderationTone(
  status: string | undefined,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'APPROVED') {
    return 'success';
  }

  if (status === 'PENDING' || status === 'FLAGGED') {
    return 'warning';
  }

  if (status === 'REJECTED') {
    return 'danger';
  }

  return 'neutral';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function formatValue(post: AdminPost) {
  const currency = post.currencyCode || 'EUR';
  const budgetParts = [post.budgetMin, post.budgetMax].filter(
    (value): value is number => typeof value === 'number',
  );
  const salaryParts = [post.salaryMin, post.salaryMax].filter(
    (value): value is number => typeof value === 'number',
  );

  if (budgetParts.length > 0) {
    return `${currency} ${budgetParts.map((value) => value.toLocaleString('ro-RO')).join(' - ')}`;
  }

  if (salaryParts.length > 0) {
    return `${currency} ${salaryParts.map((value) => value.toLocaleString('ro-RO')).join(' - ')}`;
  }

  return post.value || 'To be confirmed';
}
