"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyPublicPosts, type MarketplacePost } from "@/lib/api";

export default function PublicDashboardPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<MarketplacePost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadPosts() {
      try {
        setLoadingPosts(true);
        const nextPosts = await getMyPublicPosts(token);
        if (!cancelled) {
          setPosts(nextPosts);
        }
      } catch {
        if (!cancelled) {
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPosts(false);
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const latestPost = posts[0] ?? null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/60">
          Dashboard
        </div>
        <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
          Continue your public setup
        </h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          Your account is live. From here you can refine the profile, upload evidence, publish a
          company or professional listing, and review what is public versus still pending
          moderation.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatusPill
            label="Account approval"
            value={user?.approvalStatus?.replaceAll("_", " ") ?? "PENDING"}
          />
          <StatusPill
            label="Profile moderation"
            value={user?.profile?.moderationStatus?.replaceAll("_", " ") ?? "NOT CREATED"}
          />
          <StatusPill
            label="Latest listing"
            value={
              loadingPosts
                ? "Loading"
                : latestPost
                  ? latestPost.moderationStatus?.replaceAll("_", " ") ?? latestPost.status
                  : "No listing yet"
            }
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Profile workspace"
            description="Edit the company or professional profile, documents, taxonomy, and public visibility settings."
            href="/profile"
            cta="Open profile"
          />
          <DashboardCard
            title="Publish listing"
            description="Create or refine the public project, company, or subcontractor listing shown in the marketplace feed."
            href="/publish"
            cta="Open publish flow"
          />
          <DashboardCard
            title="Public identity"
            description="Review the public identity page generated from onboarding data and see what still waits for moderation."
            href={user?.profile?.slug ? `/profiles/${user.profile.slug}` : "/profile"}
            cta="View public page"
          />
          <DashboardCard
            title="Marketplace feed"
            description="See how approved projects and professionals appear in the public marketplace."
            href="/jobs"
            cta="Explore feed"
          />
        </div>

        <div className="mt-8 rounded-[1.6rem] border border-slate-200 bg-slate-50 p-6">
          <div className="text-sm font-semibold text-brand-charcoal">Visibility after onboarding</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You can always see your own profile and listings in the dashboard while they are still
            pending. Public visitors only see approved content after moderation.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <VisibilityRow
              label="Profile"
              value={
                user?.profile?.slug
                  ? `Pending owner view available at /profiles/${user.profile.slug}`
                  : "Create or complete your profile to unlock the public page."
              }
            />
            <VisibilityRow
              label="Latest listing"
              value={
                latestPost
                  ? `${latestPost.title} - ${latestPost.moderationStatus?.replaceAll("_", " ") ?? latestPost.status}`
                  : "No project or professional listing published yet."
              }
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5">
      <div className="text-lg font-semibold text-brand-charcoal">{title}</div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link href={href} className="mt-5 inline-flex font-semibold text-brand-navy">
        {cta}
      </Link>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-5 py-4">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-brand-charcoal">{value}</div>
    </div>
  );
}

function VisibilityRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white bg-white px-4 py-4">
      <div className="text-sm font-semibold text-brand-charcoal">{label}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{value}</div>
    </div>
  );
}
