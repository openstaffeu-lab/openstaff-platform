"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import EscoMultiSelect from "@/components/EscoMultiSelect";
import NaceSearchInput from "@/components/NaceSearchInput";
import UniclassMultiSelect from "@/components/UniclassMultiSelect";
import { useAuth } from "@/context/AuthContext";
import {
  apiRequest,
  createPublicPost,
  createPublicPostExternalLink,
  deletePublicPost,
  getLanguages,
  getMyPublicPosts,
  type MarketplacePost,
  submitOperationalFeedback,
  trackRolloutFunnelEvent,
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
  countryId: string;
  regionId: string;
  cityId: string;
  currencyCode: string;
  vatRate: string;
  budgetMin: string;
  budgetMax: string;
  salaryMin: string;
  salaryMax: string;
  experienceLabel: string;
  certifications: string;
  certificationsOffered: string;
  languageCodes: string[];
  escoCodes: string[];
  naceCodes: string[];
  uniclassCodes: string[];
};

type CountryOption = {
  id: string;
  code: string;
  name: string;
  currency: string;
  vatRate: number;
  regions: Array<{
    id: string;
    name: string;
    cities: Array<{ id: string; name: string }>;
  }>;
};

type LanguageOption = {
  id: string;
  code: string;
  name: string;
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
  countryId: "",
  regionId: "",
  cityId: "",
  currencyCode: "EUR",
  vatRate: "",
  budgetMin: "",
  budgetMax: "",
  salaryMin: "",
  salaryMax: "",
  experienceLabel: "",
  certifications: "",
  certificationsOffered: "",
  languageCodes: [],
  escoCodes: [],
  naceCodes: [],
  uniclassCodes: [],
};

export default function PublishMarketplacePage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<PublishFormState>(emptyForm);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [externalLink, setExternalLink] = useState("");

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId],
  );

  const selectedCountry = useMemo(
    () => countries.find((country) => country.id === form.countryId) ?? null,
    [countries, form.countryId],
  );

  const selectedRegion = useMemo(
    () => selectedCountry?.regions.find((region) => region.id === form.regionId) ?? null,
    [selectedCountry, form.regionId],
  );

  useEffect(() => {
    void loadReferences();
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    void trackRolloutFunnelEvent({
      eventType: "PUBLISH_STARTED",
      surface: "publish-page",
      sourceId: "public-publish",
      dedupeKey: "publish-started",
      metadata: {
        role: user?.role ?? "authenticated-user",
      },
    });

    void loadPosts();
  }, [token, user?.role]);

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
      countryId: selectedPost.country?.id ?? "",
      regionId: selectedPost.region?.id ?? "",
      cityId: selectedPost.city?.id ?? "",
      currencyCode: selectedPost.currencyCode ?? "EUR",
      vatRate:
        typeof selectedPost.vatRate === "number" ? String(selectedPost.vatRate) : "",
      budgetMin:
        typeof selectedPost.budgetMin === "number" ? String(selectedPost.budgetMin) : "",
      budgetMax:
        typeof selectedPost.budgetMax === "number" ? String(selectedPost.budgetMax) : "",
      salaryMin:
        typeof selectedPost.salaryMin === "number" ? String(selectedPost.salaryMin) : "",
      salaryMax:
        typeof selectedPost.salaryMax === "number" ? String(selectedPost.salaryMax) : "",
      experienceLabel: selectedPost.experienceLabel ?? "",
      certifications: selectedPost.certifications ?? "",
      certificationsOffered: selectedPost.certificationsOffered ?? "",
      languageCodes: selectedPost.languageCodes ?? [],
      escoCodes: selectedPost.escoCodes ?? [],
      naceCodes: selectedPost.naceCodes ?? [],
      uniclassCodes: selectedPost.uniclassCodes ?? [],
    });
  }, [selectedPost]);

  async function loadReferences() {
    try {
      const [countriesResponse, languagesResponse] = await Promise.all([
        apiRequest<CountryOption[]>("/countries"),
        getLanguages(),
      ]);
      setCountries(countriesResponse);
      setLanguages(languagesResponse);
    } catch {
      // Reference data failures should not block page rendering.
    }
  }

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

  function updateField<K extends keyof PublishFormState>(
    key: K,
    value: PublishFormState[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleLanguage(code: string) {
    setForm((current) => ({
      ...current,
      languageCodes: current.languageCodes.includes(code)
        ? current.languageCodes.filter((entry) => entry !== code)
        : [...current.languageCodes, code],
    }));
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
        value:
          form.value ||
          [
            form.currencyCode,
            form.budgetMin && form.budgetMax
              ? `${form.budgetMin} - ${form.budgetMax}`
              : form.salaryMin && form.salaryMax
                ? `${form.salaryMin} - ${form.salaryMax}`
                : "",
          ]
            .filter(Boolean)
            .join(" "),
        currencyCode: form.currencyCode || null,
        vatRate: form.vatRate ? Number(form.vatRate) : null,
        budgetMin: form.budgetMin ? Number(form.budgetMin) : null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
        countryId: form.countryId || null,
        regionId: form.regionId || null,
        cityId: form.cityId || null,
        escoCodes: form.escoCodes,
        naceCodes: form.naceCodes,
        uniclassCodes: form.uniclassCodes,
        languageCodes: form.languageCodes,
        classificationJson: {
          escoCodes: form.escoCodes,
          naceCodes: form.naceCodes,
          uniclassCodes: form.uniclassCodes,
          languageCodes: form.languageCodes,
        },
        fiscalMetadataJson: {
          currencyCode: form.currencyCode || null,
          vatRate: form.vatRate ? Number(form.vatRate) : null,
          countryCode: selectedCountry?.code ?? null,
          countryName: selectedCountry?.name ?? null,
          regionName: selectedRegion?.name ?? null,
          cityName:
            selectedRegion?.cities.find((city) => city.id === form.cityId)?.name ?? null,
        },
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
      await submitOperationalFeedback({
        feedbackType: "FAILED_FLOW",
        surface: "publish-media-upload",
        summary: "Media upload failed in the publish flow.",
        metadata: {
          postId: selectedId,
          fileName: mediaFile.name,
        },
      });
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
      await submitOperationalFeedback({
        feedbackType: "FAILED_FLOW",
        surface: "publish-document-upload",
        summary: "Document upload failed in the publish flow.",
        metadata: {
          postId: selectedId,
          fileName: documentFile.name,
        },
      });
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
          <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">
            Marketplace Publish
          </div>
          <h1 className="mt-4 text-3xl font-semibold">
            Sign in to publish your public listing.
          </h1>
          <p className="mt-4 text-slate-300">
            Public posts use the same JWT-first account flow. After publishing, every
            post and asset enters moderation before appearing in the live feed.
          </p>
          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-emerald-300/30 px-5 py-3 font-semibold text-emerald-200"
            >
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
              <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">
                My Feed Assets
              </div>
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
                  <StatusPill
                    label={post.status}
                    tone={post.status === "LIVE" ? "success" : "warning"}
                  />
                  <StatusPill
                    label={post.moderationStatus ?? "PENDING"}
                    tone={
                      post.moderationStatus === "APPROVED"
                        ? "success"
                        : post.moderationStatus === "REJECTED"
                          ? "danger"
                          : "warning"
                    }
                  />
                </div>
                <div className="mt-3 font-semibold text-white">{post.title}</div>
                <div className="mt-1 text-sm text-slate-400">
                  {post.location || "Unspecified"}
                </div>
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
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">
                  Composer
                </div>
                <h2 className="mt-3 text-2xl font-semibold">
                  {selectedId ? "Edit public post" : "Create public post"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-400">
                  Projects, professionals, and subcontractor pools are published into the
                  moderated marketplace feed.
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
                  onChange={(event) =>
                    updateField("type", event.target.value as PublishFormState["type"])
                  }
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
                  onChange={(event) =>
                    updateField(
                      "visibility",
                      event.target.value as PublishFormState["visibility"],
                    )
                  }
                  className={inputClass}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </Field>
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Domain">
                <input
                  value={form.domain}
                  onChange={(event) => updateField("domain", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Location label">
                <input
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Owner name">
                <input
                  value={form.ownerName}
                  onChange={(event) => updateField("ownerName", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Owner type">
                <input
                  value={form.ownerType}
                  onChange={(event) => updateField("ownerType", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Experience">
                <input
                  value={form.experienceLabel}
                  onChange={(event) => updateField("experienceLabel", event.target.value)}
                  className={inputClass}
                  placeholder="e.g. 10+ years industrial delivery"
                />
              </Field>
            </div>

            <div className="mt-4 grid gap-4">
              <Field label="Summary">
                <input
                  value={form.summary}
                  onChange={(event) => updateField("summary", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className={`${inputClass} min-h-40`}
                />
              </Field>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Field label="Country">
                <select
                  value={form.countryId}
                  onChange={(event) =>
                    setForm((current) => {
                      const country =
                        countries.find((item) => item.id === event.target.value) ?? null;
                      return {
                        ...current,
                        countryId: event.target.value,
                        regionId: "",
                        cityId: "",
                        currencyCode: country?.currency || current.currencyCode,
                        vatRate:
                          typeof country?.vatRate === "number"
                            ? String(country.vatRate)
                            : current.vatRate,
                      };
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select country</option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.id}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Region">
                <select
                  value={form.regionId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      regionId: event.target.value,
                      cityId: "",
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Select region</option>
                  {selectedCountry?.regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="City">
                <select
                  value={form.cityId}
                  onChange={(event) => updateField("cityId", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select city</option>
                  {selectedRegion?.cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <Field label="Currency">
                <input
                  value={form.currencyCode}
                  onChange={(event) => updateField("currencyCode", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="VAT %">
                <input
                  value={form.vatRate}
                  onChange={(event) => updateField("vatRate", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Budget min">
                <input
                  value={form.budgetMin}
                  onChange={(event) => updateField("budgetMin", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Budget max">
                <input
                  value={form.budgetMax}
                  onChange={(event) => updateField("budgetMax", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Salary min">
                <input
                  value={form.salaryMin}
                  onChange={(event) => updateField("salaryMin", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Salary max">
                <input
                  value={form.salaryMax}
                  onChange={(event) => updateField("salaryMax", event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Fallback value label" className="md:col-span-2">
                <input
                  value={form.value}
                  onChange={(event) => updateField("value", event.target.value)}
                  className={inputClass}
                  placeholder="Shown if no structured budget / salary is available"
                />
              </Field>
            </div>

            <div className="mt-8 space-y-4">
              <Field label="Languages">
                <div className="flex flex-wrap gap-3">
                  {languages.map((language) => {
                    const selected = form.languageCodes.includes(language.code);
                    return (
                      <button
                        key={language.id}
                        type="button"
                        onClick={() => toggleLanguage(language.code)}
                        className={`rounded-full px-4 py-2 text-sm font-medium ${
                          selected
                            ? "bg-cyan-300 text-slate-950"
                            : "border border-slate-700 bg-slate-900 text-slate-300"
                        }`}
                      >
                        {language.name}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="NACE">
                <NaceSearchInput
                  value={form.naceCodes.join(", ")}
                  onChange={(code) =>
                    setForm((current) => ({
                      ...current,
                      naceCodes: current.naceCodes.includes(code)
                        ? current.naceCodes
                        : [...current.naceCodes, code],
                    }))
                  }
                />
                <SelectedTagList
                  items={form.naceCodes}
                  onRemove={(code) =>
                    setForm((current) => ({
                      ...current,
                      naceCodes: current.naceCodes.filter((entry) => entry !== code),
                    }))
                  }
                />
              </Field>

              <Field label="ESCO">
                <EscoMultiSelect
                  value={form.escoCodes}
                  onChange={(escoCodes) => updateField("escoCodes", escoCodes)}
                />
              </Field>

              <Field label="Uniclass">
                <UniclassMultiSelect
                  value={form.uniclassCodes}
                  onChange={(uniclassCodes) => updateField("uniclassCodes", uniclassCodes)}
                />
              </Field>

              <Field label="Certifications required">
                <input
                  value={form.certifications}
                  onChange={(event) => updateField("certifications", event.target.value)}
                  className={inputClass}
                  placeholder="Comma separated"
                />
              </Field>

              <Field label="Certifications offered">
                <input
                  value={form.certificationsOffered}
                  onChange={(event) =>
                    updateField("certificationsOffered", event.target.value)
                  }
                  className={inputClass}
                  placeholder="Comma separated"
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
              <Link
                href="/jobs"
                className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-200"
              >
                View feed
              </Link>
            </div>
          </form>

          {selectedPost ? (
            <section className="rounded-[2rem] border border-slate-800 bg-slate-950/85 p-6">
              <div className="text-xs uppercase tracking-[0.32em] text-cyan-300">
                Assets & Links
              </div>
              <h3 className="mt-3 text-2xl font-semibold">Moderated attachments</h3>
              <p className="mt-2 text-sm text-slate-400">
                Every upload is queued for operator review and stays hidden until it is
                approved.
              </p>

              <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <AssetCard title="Media" subtitle="Images or videos">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleUploadMedia}
                    disabled={!mediaFile || saving}
                    className={buttonClass}
                  >
                    Upload media
                  </button>
                  <AssetList
                    items={(selectedPost.media ?? []).map(
                      (item) => `${item.type} - ${item.status ?? "PENDING"}`,
                    )}
                  />
                </AssetCard>

                <AssetCard title="Documents" subtitle="PDF or supporting files">
                  <input
                    value={documentTitle}
                    onChange={(event) => setDocumentTitle(event.target.value)}
                    placeholder="Document title"
                    className={inputClass}
                  />
                  <input
                    type="file"
                    onChange={(event) => setDocumentFile(event.target.files?.[0] ?? null)}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleUploadDocument}
                    disabled={!documentFile || saving}
                    className={buttonClass}
                  >
                    Upload document
                  </button>
                  <AssetList
                    items={(selectedPost.documents ?? []).map(
                      (item) => `${item.title} - ${item.status ?? "PENDING"}`,
                    )}
                  />
                </AssetCard>

                <AssetCard title="External links" subtitle="Trusted public references">
                  <input
                    value={externalLink}
                    onChange={(event) => setExternalLink(event.target.value)}
                    placeholder="https://example.com/reference"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAddExternalLink}
                    disabled={!externalLink || saving}
                    className={buttonClass}
                  >
                    Submit external link
                  </button>
                  <AssetList
                    items={(selectedPost.externalLinks ?? []).map(
                      (item) => `${item.url} - ${item.securityStatus ?? "PENDING"}`,
                    )}
                  />
                </AssetCard>
              </div>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm text-slate-300 ${className ?? ""}`}>
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
        <div
          key={item}
          className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300"
        >
          {item}
        </div>
      ))}
    </div>
  );
}

function SelectedTagList({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (value: string) => void;
}) {
  if (!items.length) {
    return <div className="text-xs text-slate-500">No codes selected yet.</div>;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onRemove(item)}
          className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300"
        >
          {item} x
        </button>
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

  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  );
}

const inputClass =
  "rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500";

const buttonClass =
  "rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50";
