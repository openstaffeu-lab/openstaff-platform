/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ApiError,
  getPublicCompanyProfile,
  resolveAssetUrl,
  type PublicCompanyProfile,
} from "@/lib/api";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type CompanyPageState =
  | { kind: "available"; profile: PublicCompanyProfile }
  | { kind: "unavailable" };

async function loadCompany(slug: string): Promise<CompanyPageState> {
  try {
    const profile = await getPublicCompanyProfile(slug);
    return { kind: "available", profile };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
      return { kind: "unavailable" };
    }

    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const state = await loadCompany(slug);

  if (state.kind === "unavailable") {
    return {
      title: "Company unavailable | OpenStaff",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: state.profile.companyPage.seo.title,
    description: state.profile.companyPage.seo.description,
    openGraph: {
      title: state.profile.companyPage.seo.title,
      description: state.profile.companyPage.seo.description,
      images: state.profile.companyPage.bannerUrl
        ? [resolveAssetUrl(state.profile.companyPage.bannerUrl) ?? ""]
        : undefined,
    },
  };
}

export default async function PublicCompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const state = await loadCompany(slug);

  if (state.kind === "unavailable") {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
        <section className="mx-auto max-w-4xl border-l-4 border-teal-600 bg-white px-8 py-10 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
            OpenStaff Company
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-normal">
            This company page is not public.
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            The profile may still be private, pending moderation, offline, or not configured
            as an approved company profile.
          </p>
        </section>
      </main>
    );
  }

  const { profile } = state;
  const company = profile.companyPage;
  const bannerUrl = resolveAssetUrl(company.bannerUrl || profile.assets.bannerUrl);
  const logoUrl = resolveAssetUrl(company.logoUrl || profile.assets.logoUrl);
  const location = [profile.geography.city?.name, profile.geography.region?.name, profile.geography.country?.name]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${profile.companyName ?? profile.displayName} banner`}
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        ) : null}
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative mx-auto grid min-h-[520px] max-w-7xl content-end gap-8 px-6 py-12 lg:grid-cols-[1fr_320px] lg:px-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-200">
              OpenStaff Company
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={`${profile.companyName ?? profile.displayName} logo`}
                  className="h-20 w-20 rounded-lg border border-white/20 bg-white object-cover"
                />
              ) : null}
              <div>
                <h1 className="text-4xl font-semibold tracking-normal md:text-6xl">
                  {profile.companyName ?? profile.displayName}
                </h1>
                <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-200">
                  {profile.publicHeadline ?? profile.contractorProfile?.tradeFocus ?? profile.profileType.replaceAll("_", " ")}
                </p>
              </div>
            </div>
            <p className="mt-8 max-w-4xl text-base leading-8 text-slate-200">
              {company.aiSummary.text}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Badge label={profile.trust?.status ?? "APPROVED"} />
              <Badge label={profile.profileType.replaceAll("_", " ")} />
              {location ? <Badge label={location} /> : null}
              {profile.websiteUrl ? <Badge label={profile.websiteUrl} /> : null}
            </div>
          </div>

          <aside className="self-end border border-white/15 bg-white/10 p-6 backdrop-blur">
            <div className="text-sm font-semibold text-white">Contact</div>
            <div className="mt-4 space-y-3 text-sm text-slate-200">
              <div>{company.contactCta.email ?? "Email available on request"}</div>
              <div>{company.contactCta.phone ?? "Phone available on request"}</div>
              {company.contactCta.website ? (
                <a
                  href={company.contactCta.website}
                  className="block text-cyan-200 underline-offset-4 hover:underline"
                >
                  {company.contactCta.website}
                </a>
              ) : null}
            </div>
            <Link
              href={`/profiles/${profile.slug}`}
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-cyan-300 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              View verified profile
            </Link>
          </aside>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-4 lg:px-8">
          <Metric label="Projects" value={String(company.projects.length)} />
          <Metric label="Certifications" value={String(company.certifications.length)} />
          <Metric
            label="AI confidence"
            value={company.aiSummary.score === null ? "Logged" : `${Math.round(company.aiSummary.score)}%`}
          />
          <Metric label="Moderation" value={company.moderation.moderationStatus} />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-12 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="space-y-12">
          <section>
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
              Company Summary
            </div>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal">
              {profile.displayName}
            </h2>
            <p className="mt-4 max-w-4xl leading-8 text-slate-700">
              {profile.summary || profile.description || company.aiSummary.text}
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Detail label="Trade focus" value={profile.contractorProfile?.tradeFocus} />
              <Detail label="Service area" value={profile.contractorProfile?.serviceArea || location} />
              <Detail label="Team size" value={profile.contractorProfile?.teamSize?.toString()} />
              <Detail label="Availability" value={profile.availabilityStatus} />
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
                  Projects
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-normal">
                  Public marketplace work
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {company.projects.length ? (
                company.projects.map((project) => (
                  <ProjectPreview key={project.id} project={project} />
                ))
              ) : (
                <div className="border border-dashed border-slate-300 bg-white p-6 text-slate-600">
                  No approved public company projects are attached yet.
                </div>
              )}
            </div>
          </section>

          {company.gallery.length ? (
            <section>
              <div className="text-xs font-bold uppercase tracking-[0.24em] text-teal-700">
                Gallery
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {company.gallery.map((assetUrl) => {
                  const resolvedUrl = resolveAssetUrl(assetUrl);
                  return resolvedUrl ? (
                    <img
                      key={assetUrl}
                      src={resolvedUrl}
                      alt={`${profile.companyName ?? profile.displayName} gallery`}
                      className="h-56 w-full rounded-lg object-cover"
                    />
                  ) : null;
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-8">
          <Panel title="Certifications">
            <TagList
              items={company.certifications.length ? company.certifications : ["Pending public certification details"]}
            />
          </Panel>

          <Panel title="Taxonomy">
            <TagList items={company.taxonomy.nace.map((item) => `NACE ${item.code}`)} />
            <TagList items={company.taxonomy.esco.map((item) => `ESCO ${item.code}`)} />
            <TagList items={company.taxonomy.uniclass.map((item) => `UNICLASS ${item.code}`)} />
          </Panel>

          <Panel title="AI Governance">
            <div className="space-y-3 text-sm leading-6 text-slate-700">
              <div>Result: {company.aiSummary.sourceResultId ?? "profile baseline"}</div>
              <div>Status: {company.aiSummary.status ?? "APPROVED"}</div>
              <div>Fallback: {company.aiSummary.fallbackUsed ? "yes" : "no"}</div>
              <div>{company.moderation.rule}</div>
            </div>
          </Panel>
        </aside>
      </section>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-white">
      {label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-slate-200 px-4">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border border-slate-200 bg-white p-5">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-900">{value || "-"}</div>
    </div>
  );
}

function ProjectPreview({
  project,
}: {
  project: PublicCompanyProfile["companyPage"]["projects"][number];
}) {
  const mediaUrl = resolveAssetUrl(project.bannerUrl || project.media[0]?.url);

  return (
    <article className="overflow-hidden border border-slate-200 bg-white">
      {mediaUrl ? (
        <img src={mediaUrl} alt={project.title} className="h-48 w-full object-cover" />
      ) : null}
      <div className="p-6">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
          {project.domain}
        </div>
        <h3 className="mt-3 text-xl font-semibold">{project.title}</h3>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
          {project.summary || project.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {[...project.taxonomy.naceCodes, ...project.taxonomy.escoCodes, ...project.taxonomy.uniclassCodes]
            .slice(0, 5)
            .map((item) => (
              <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                {item}
              </span>
            ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 text-sm text-slate-500">
          <span>{project.location}</span>
          <span>{project.value}</span>
        </div>
      </div>
    </article>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-slate-200 bg-white p-6">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-teal-700">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {items.length ? (
        items.map((item) => (
          <span key={item} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
            {item}
          </span>
        ))
      ) : (
        <span className="text-sm text-slate-500">No public tags approved yet.</span>
      )}
    </div>
  );
}
