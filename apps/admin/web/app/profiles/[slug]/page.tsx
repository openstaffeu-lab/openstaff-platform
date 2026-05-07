"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiRequest, getStoredToken } from "../../../lib/api";

type PublicProfile = {
  id: string;
  slug: string;
  profileType: string;
  displayName: string;
  companyName: string | null;
  publicHeadline: string | null;
  summary: string | null;
  description: string | null;
  websiteUrl: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  visibility: string;
  moderationStatus: string;
  status: string;
  geography: {
    country: { name: string } | null;
    region: { name: string } | null;
    city: { name: string } | null;
  };
  languages: Array<{ id: string; name: string }>;
  escoSkills: Array<{ id: string; title: string }>;
  naceCodes: Array<{ id: string; code: string; title: string }>;
  uniclassCodes: Array<{ id: string; code: string; title: string }>;
  contractorProfile: {
    tradeFocus: string | null;
    teamSize: number | null;
    serviceArea: string | null;
  } | null;
  professionalProfile: {
    headline: string | null;
    yearsExperience: number | null;
    portfolioFocus: string | null;
  } | null;
  assets: {
    logoUrl: string | null;
    photoUrl: string | null;
    bannerUrl: string | null;
    portfolioUrls: string[];
  };
};

export default function PublicProfilePage() {
  const params = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "restricted" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const slug = params?.slug;

    if (!slug) {
      setState("error");
      setMessage("Missing profile slug.");
      return;
    }

    async function load() {
      setState("loading");
      setMessage(null);

      try {
        const publicProfile = await apiRequest<PublicProfile>(`/profiles/public/${slug}`);
        setProfile(publicProfile);
        setState("ready");
      } catch (error) {
        const token = getStoredToken();

        if (token) {
          try {
            const restrictedProfile = await apiRequest<PublicProfile>(`/profiles/restricted/${slug}`, {
              token,
            });
            setProfile(restrictedProfile);
            setState("ready");
            return;
          } catch (restrictedError) {
            if (restrictedError instanceof ApiError && restrictedError.status === 403) {
              setState("restricted");
              setMessage("This profile is visible only to approved users or the profile owner.");
              return;
            }

            setState("error");
            setMessage(
              restrictedError instanceof Error
                ? restrictedError.message
                : "Failed to load profile.",
            );
            return;
          }
        }

        if (error instanceof ApiError && error.status === 403) {
          setState("restricted");
          setMessage("This profile is not publicly visible right now.");
          return;
        }

        setState("error");
        setMessage(error instanceof Error ? error.message : "Failed to load profile.");
      }
    }

    void load();
  }, [params?.slug]);

  if (state === "loading") {
    return <main className="px-6 py-12 text-slate-600">Loading public profile...</main>;
  }

  if (state === "restricted") {
    return (
      <main className="px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-200 bg-amber-50 p-8 text-amber-900">
          <h1 className="text-2xl font-semibold">Profile restricted</h1>
          <p className="mt-3 text-sm">{message}</p>
        </div>
      </main>
    );
  }

  if (state === "error" || !profile) {
    return (
      <main className="px-6 py-12">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-900">
          <h1 className="text-2xl font-semibold">Profile unavailable</h1>
          <p className="mt-3 text-sm">{message}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2.4rem] border border-slate-200 bg-white shadow-sm">
          {profile.assets.bannerUrl ? (
            <img src={profile.assets.bannerUrl} alt={profile.displayName} className="h-64 w-full object-cover" />
          ) : (
            <div className="h-56 bg-[linear-gradient(135deg,#163a70,#1f6db1,#7fe7dc)]" />
          )}

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-[180px_1fr_260px]">
            <div>
              {profile.assets.photoUrl ? (
                <img src={profile.assets.photoUrl} alt={profile.displayName} className="h-40 w-40 rounded-[2rem] object-cover shadow-lg" />
              ) : profile.assets.logoUrl ? (
                <img src={profile.assets.logoUrl} alt={profile.displayName} className="h-40 w-40 rounded-[2rem] object-contain bg-slate-50 p-6 shadow-lg" />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-[2rem] bg-slate-100 text-3xl font-semibold text-slate-500 shadow-lg">
                  {profile.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                {profile.profileType.replaceAll("_", " ")}
              </div>
              <h1 className="mt-3 text-4xl font-bold text-brand-charcoal">{profile.displayName}</h1>
              {profile.companyName ? (
                <div className="mt-2 text-lg text-slate-600">{profile.companyName}</div>
              ) : null}
              {profile.publicHeadline ? (
                <div className="mt-4 text-xl text-slate-700">{profile.publicHeadline}</div>
              ) : null}
              {profile.summary ? (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">{profile.summary}</p>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Contact</div>
              <div className="mt-4 space-y-3 text-sm text-slate-700">
                {profile.publicEmail ? <div>{profile.publicEmail}</div> : null}
                {profile.publicPhone ? <div>{profile.publicPhone}</div> : null}
                {profile.websiteUrl ? (
                  <Link href={profile.websiteUrl} className="font-semibold text-brand-navy">
                    Open website
                  </Link>
                ) : null}
                <div>
                  {[profile.geography.city?.name, profile.geography.region?.name, profile.geography.country?.name]
                    .filter(Boolean)
                    .join(", ") || "Location not published"}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Card title="About">
              <p className="text-sm leading-7 text-slate-600">
                {profile.description || "No extended public description has been published yet."}
              </p>
            </Card>

            {profile.contractorProfile ? (
              <Card title="Contractor Details">
                <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-700">
                  <Info label="Trade focus" value={profile.contractorProfile.tradeFocus} />
                  <Info label="Team size" value={profile.contractorProfile.teamSize?.toString() ?? null} />
                  <Info label="Service area" value={profile.contractorProfile.serviceArea} />
                </div>
              </Card>
            ) : null}

            {profile.professionalProfile ? (
              <Card title="Professional Details">
                <div className="grid gap-4 md:grid-cols-3 text-sm text-slate-700">
                  <Info label="Headline" value={profile.professionalProfile.headline} />
                  <Info label="Experience" value={profile.professionalProfile.yearsExperience ? `${profile.professionalProfile.yearsExperience} years` : null} />
                  <Info label="Portfolio focus" value={profile.professionalProfile.portfolioFocus} />
                </div>
              </Card>
            ) : null}

            <Card title="Portfolio">
              <div className="grid gap-4 md:grid-cols-2">
                {profile.assets.portfolioUrls.length ? (
                  profile.assets.portfolioUrls.map((assetUrl) => (
                    <img key={assetUrl} src={assetUrl} alt={profile.displayName} className="h-56 w-full rounded-[1.4rem] object-cover" />
                  ))
                ) : (
                  <div className="rounded-[1.4rem] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No portfolio assets published yet.
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card title="Skills">
              <TagList items={profile.escoSkills.map((item) => item.title)} />
            </Card>
            <Card title="NACE">
              <TagList items={profile.naceCodes.map((item) => `${item.code} ${item.title}`)} />
            </Card>
            <Card title="Uniclass">
              <TagList items={profile.uniclassCodes.map((item) => `${item.code} ${item.title}`)} />
            </Card>
            <Card title="Languages">
              <TagList items={profile.languages.map((item) => item.name)} />
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-brand-charcoal">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[1.3rem] bg-slate-50 p-4">
      <div className="text-xs uppercase tracking-[0.25em] text-slate-500">{label}</div>
      <div className="mt-2 font-medium text-brand-charcoal">{value || "Not published"}</div>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.length ? (
        items.map((item) => (
          <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            {item}
          </span>
        ))
      ) : (
        <div className="text-sm text-slate-500">No public items yet.</div>
      )}
    </div>
  );
}
