"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  createPublicPost,
  createPublicPostExternalLink,
  deletePublicPost,
  getMyPublicPosts,
  type MarketplacePost,
  updatePublicPost,
  uploadPublicPostDocument,
  uploadPublicPostMedia,
} from "@/lib/api";

type PublishFormState = {
  type: "PROJECT" | "PROFESSIONAL" | "SUBCONTRACTOR_POOL";
  title: string;
  summary: string;
  description: string;
  domain: string;
  location: string;
  value: string;
  ownerName: string;
  ownerType: string;
  visibility: "PUBLIC" | "PRIVATE";
  externalLinkUrl: string;
};

const emptyForm: PublishFormState = {
  type: "PROJECT",
  title: "",
  summary: "",
  description: "",
  domain: "",
  location: "",
  value: "",
  ownerName: "",
  ownerType: "",
  visibility: "PUBLIC",
  externalLinkUrl: "",
};

export default function PublishMarketplacePage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PublishFormState>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [externalLink, setExternalLink] = useState("");

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    void loadPosts();
  }, [token]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId],
  );

  useEffect(() => {
    if (!selectedPost) {
      return;
    }

    setForm({
      type: selectedPost.type,
      title: selectedPost.title,
      summary: selectedPost.summary ?? "",
      description: selectedPost.description,
      domain: selectedPost.domain,
      location: selectedPost.location,
      value: selectedPost.value,
      ownerName: selectedPost.ownerName,
      ownerType: selectedPost.ownerType,
      visibility: selectedPost.visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
      externalLinkUrl: "",
    });
  }, [selectedPost]);

  async function loadPosts() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPublicPosts(token);
      setPosts(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Public posts could not load.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof PublishFormState>(key: K, value: PublishFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetComposer() {
    setSelectedId(null);
    setForm({
      ...emptyForm,
      ownerName: user?.displayName ?? "",
      ownerType: user?.actorType ?? "",
    });
    setDocumentTitle("");
    setExternalLink("");
    setMediaFile(null);
    setDocumentFile(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setMessage(null);

      const payload = {
        ...form,
        ownerName: form.ownerName || user?.displayName || "OpenStaff member",
        ownerType: form.ownerType || user?.actorType || "Marketplace user",
      };

      const result = selectedId
        ? await updatePublicPost(selectedId, payload, token)
        : await createPublicPost(payload, token);

      setMessage(
        selectedId
          ? "Post updated. It was moved back to moderation review."
          : "Post created and sent to moderation.",
      );
      await loadPosts();
      setSelectedId(result.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId || !token) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await deletePublicPost(selectedId, token);
      setMessage("Post deleted.");
      await loadPosts();
      resetComposer();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Post could not be deleted.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadMedia() {
    if (!selectedId || !mediaFile || !token) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await uploadPublicPostMedia(
        selectedId,
        {
          file: mediaFile,
          role: "GALLERY",
          alt: mediaFile.name,
        },
        token,
      );
      setMessage("Media uploaded and queued for moderation.");
      setMediaFile(null);
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Media upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadDocument() {
    if (!selectedId || !documentFile || !token) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await uploadPublicPostDocument(
        selectedId,
        {
          file: documentFile,
          title: documentTitle || documentFile.name,
        },
        token,
      );
      setMessage("Document uploaded and queued for moderation.");
      setDocumentFile(null);
      setDocumentTitle("");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExternalLink() {
    if (!selectedId || !externalLink || !token) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createPublicPostExternalLink(selectedId, { url: externalLink }, token);
      setMessage("External link submitted for moderation.");
      setExternalLink("");
      await loadPosts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "External link submission failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10 text-white">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-8">
          <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">Marketplace Publish</div>
          <h1 className="mt-4 text-3xl font-semibold">Sign in to publish your public listing.</h1>
          <p className="mt-4 text-slate-300">
            Public posts use the same JWT-first account flow. After publishing, every post and asset
            enters moderation before appearing in the live feed.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/login" className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950">
              Login
            </Link>
            <Link href="/register" className="rounded-2xl border border-emerald-300/30 px-5 py-3 font-semibold text-emerald-200">
              Register
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10 text-white">
      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">My Feed Assets</div>
              <h1 className="mt-3 text-2xl font-semibold">Public Posts</h1>
            </div>
            <button
              type="button"
              onClick={resetComposer}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200"
            >
              New
            </button>
          </div>

          {loading ? <p className="mt-6 text-sm text-slate-400">Loading your posts...</p> : null}
          {error ? <p className="mt-6 text-sm text-rose-300">{error}</p> : null}
          {message ? <p className="mt-6 text-sm text-emerald-300">{message}</p> : null}

          <div className="mt-6 grid gap-3">
            {posts.map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setSelectedId(post.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  selectedId === post.id
                    ? "border-cyan-400/40 bg-cyan-400/10"
                    : "border-slate-800 bg-slate-900/70"
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  <StatusPill label={post.type} tone="neutral" />
                  <StatusPill label={post.status} tone={post.status === "LIVE" ? "success" : "warning"} />
                  <StatusPill
                    label={post.moderationStatus ?? "PENDING"}
                    tone={post.moderationStatus === "APPROVED" ? "success" : post.moderationStatus === "REJECTED" ? "danger" : "warning"}
                  />
                </div>
                <div className="mt-3 font-semibold text-white">{post.title}</div>
                <div className="mt-1 text-sm text-slate-400">{post.location || "Unspecified"}</div>
              </button>
            ))}

            {!loading && posts.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-6 text-sm text-slate-400">
                No public posts yet. Create your first listing from the form.
              </div>
            ) : null}
          </div>
        </aside>

        <section className="grid gap-6">
          <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">Composer</div>
                <h2 className="mt-3 text-2xl font-semibold">
                  {selectedId ? "Edit public post" : "Create public post"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Projects, professionals, and subcontractor pools now publish through the moderated
                  `PublicPost` feed.
                </p>
              </div>
              {selectedId ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-2xl border border-rose-400/30 px-4 py-3 text-sm font-semibold text-rose-200 disabled:opacity-50"
                >
                  Delete post
                </button>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Type">
                <select
                  value={form.type}
                  onChange={(event) => updateField("type", event.target.value as PublishFormState["type"])}
                  className={inputClass}
                >
                  <option value="PROJECT">Project</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="SUBCONTRACTOR_POOL">Subcontractor pool</option>
                </select>
              </Field>
              <Field label="Visibility">
                <select
                  value={form.visibility}
                  onChange={(event) => updateField("visibility", event.target.value as PublishFormState["visibility"])}
                  className={inputClass}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </Field>
              <Field label="Title">
                <input value={form.title} onChange={(event) => updateField("title", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Domain">
                <input value={form.domain} onChange={(event) => updateField("domain", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Location">
                <input value={form.location} onChange={(event) => updateField("location", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Value / Budget label">
                <input value={form.value} onChange={(event) => updateField("value", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Owner name">
                <input value={form.ownerName} onChange={(event) => updateField("ownerName", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Owner type">
                <input value={form.ownerType} onChange={(event) => updateField("ownerType", event.target.value)} className={inputClass} />
              </Field>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="Summary">
                <input value={form.summary} onChange={(event) => updateField("summary", event.target.value)} className={inputClass} />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className={`${inputClass} min-h-40`}
                />
              </Field>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {saving ? "Saving..." : selectedId ? "Save changes" : "Create post"}
              </button>
              <Link href="/jobs" className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-200">
                View feed
              </Link>
            </div>
          </form>

          {selectedPost ? (
            <section className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-6">
              <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">Assets & Links</div>
              <h3 className="mt-3 text-2xl font-semibold">Moderated attachments</h3>
              <p className="mt-2 text-sm text-slate-400">
                Every upload creates a moderation placeholder task and stays hidden until admin approval.
              </p>

              <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <AssetCard title="Media" subtitle="Images or videos">
                  <input type="file" accept="image/*,video/*" onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} className={inputClass} />
                  <button type="button" onClick={handleUploadMedia} disabled={!mediaFile || saving} className={buttonClass}>
                    Upload media
                  </button>
                  <AssetList items={(selectedPost.media ?? []).map((item) => `${item.type} · ${item.status ?? "PENDING"}`)} />
                </AssetCard>

                <AssetCard title="Documents" subtitle="PDF or supporting files">
                  <input value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Document title" className={inputClass} />
                  <input type="file" onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)} className={inputClass} />
                  <button type="button" onClick={handleUploadDocument} disabled={!documentFile || saving} className={buttonClass}>
                    Upload document
                  </button>
                  <AssetList items={(selectedPost.documents ?? []).map((item) => `${item.title} · ${item.status ?? "PENDING"}`)} />
                </AssetCard>

                <AssetCard title="External links" subtitle="Trusted public references">
                  <input value={externalLink} onChange={(event) => setExternalLink(event.target.value)} placeholder="https://example.com/reference" className={inputClass} />
                  <button type="button" onClick={handleAddExternalLink} disabled={!externalLink || saving} className={buttonClass}>
                    Submit external link
                  </button>
                  <AssetList items={(selectedPost.externalLinks ?? []).map((item) => `${item.url} · ${item.securityStatus ?? "PENDING"}`)} />
                </AssetCard>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="font-semibold">{label}</span>
      {children}
    </label>
  );
}

function AssetCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-1 text-xs text-slate-400">{subtitle}</div>
      <div className="mt-4 grid gap-3">{children}</div>
    </div>
  );
}

function AssetList({ items }: { items: string[] }) {
  if (!items.length) {
    return <div className="text-xs text-slate-500">No items uploaded yet.</div>;
  }

  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <div key={item} className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
          {item}
        </div>
      ))}
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const styles =
    tone === "success"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "danger"
        ? "border-rose-400/30 bg-rose-400/10 text-rose-200"
        : tone === "warning"
          ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
          : "border-slate-700 bg-slate-900 text-slate-300";

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>{label}</span>;
}

const inputClass =
  "rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500";

const buttonClass =
  "rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50";
