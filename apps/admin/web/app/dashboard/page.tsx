"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getMyPublicPosts, type AuthUser, type MarketplacePost } from "@/lib/api";

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
  const profile = user?.profile ?? null;
  const publicVisibility = useMemo(() => getPublicVisibility(user, latestPost), [user, latestPost]);
  const nextAction = useMemo(() => getNextAction(user, latestPost), [user, latestPost]);
  const isSuperadmin = user?.role === "SUPERADMIN";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-navy/60">
              Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-bold text-brand-charcoal md:text-4xl">
              Owner setup pipeline
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Use this workspace to finish account security, profile completion, company
              or contractor context, location and taxonomy, and moderated publishing.
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm leading-6 text-cyan-950 lg:max-w-sm">
            <strong>Required next action:</strong> {nextAction.label}
            <div className="mt-3">
              <Link
                href={nextAction.href}
                prefetch={false}
                className="inline-flex rounded-2xl bg-brand-navy px-4 py-2 font-semibold text-white"
              >
                {nextAction.cta}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatusCard
            label="Account approval"
            value={formatStatus(user?.approvalStatus ?? "PENDING")}
            tone={user?.approvalStatus === "APPROVED" ? "success" : user?.approvalStatus === "REJECTED" ? "danger" : "warning"}
          />
          <StatusCard
            label="Profile moderation"
            value={formatStatus(profile?.moderationStatus ?? "NOT_CREATED")}
            tone={profile?.moderationStatus === "APPROVED" ? "success" : profile?.moderationStatus === "REJECTED" ? "danger" : "warning"}
          />
          <StatusCard
            label="Public visibility"
            value={publicVisibility.status}
            tone={publicVisibility.tone}
          />
          <StatusCard
            label="Latest listing"
            value={
              loadingPosts
                ? "Loading"
                : latestPost
                  ? lifecycleLabel(latestPost)
                  : "No post yet"
            }
            tone={latestPost ? postTone(latestPost) : "neutral"}
          />
        </div>

        <div className="mt-6 rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
          <div className="text-sm font-semibold text-brand-charcoal">Public availability</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{publicVisibility.reason}</p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardAction
            title="Complete profile"
            description="Edit profile identity, visibility, location, languages, NACE, ESCO, Uniclass, and media."
            href="/profile"
            cta="Open profile"
            primary={!profile}
          />
          <DashboardAction
            title="Security"
            description="Review sign-in protection. If 2FA is enabled or enforced, login routes through the challenge automatically."
            href="/security"
            cta="Review security"
          />
          <DashboardAction
            title="Create post"
            description="Save a private draft or submit an opportunity, professional post, or subcontractor pool for review."
            href="/publish"
            cta="Open publish"
            primary={Boolean(profile)}
          />
          <DashboardAction
            title="Public preview"
            description="View the public profile route and see the business-readable reason if it is not visible yet."
            href={profile?.slug ? `/profiles/${profile.slug}` : "/profile"}
            cta="View preview"
          />
        </div>

        {isSuperadmin ? (
          <div className="mt-6 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
            Superadmin action available: review account approvals, profile moderation, and
            listing moderation in backoffice before public exposure.
            <div className="mt-3">
              <a
                href="https://backoffice.openstaff.eu"
                className="inline-flex rounded-2xl bg-emerald-600 px-4 py-2 font-semibold text-white"
              >
                Open backoffice approval
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function getPublicVisibility(user: AuthUser | null | undefined, latestPost: MarketplacePost | null) {
  const profile = user?.profile ?? null;

  if (!profile) {
    return {
      status: "Profile missing",
      reason: "Create a profile before sharing a public page or publishing owner data.",
      tone: "warning" as const,
    };
  }

  if (user?.approvalStatus !== "APPROVED") {
    return {
      status: "Blocked by account",
      reason:
        "The profile is approved, but public visibility is blocked until account approval is complete.",
      tone: "warning" as const,
    };
  }

  if (profile.moderationStatus !== "APPROVED") {
    return {
      status: "Profile review",
      reason: "The profile is saved, but it must pass moderation before public visitors can see it.",
      tone: profile.moderationStatus === "REJECTED" ? ("danger" as const) : ("warning" as const),
    };
  }

  if (profile.visibility !== "PUBLIC" || profile.status !== "LIVE") {
    return {
      status: "Private or offline",
      reason: "The profile is approved, but public visibility also requires PUBLIC visibility and LIVE status.",
      tone: "warning" as const,
    };
  }

  if (latestPost && postTone(latestPost) !== "success") {
    return {
      status: "Profile live",
      reason: "The profile can be public. The latest post still follows its own moderation lifecycle.",
      tone: "success" as const,
    };
  }

  return {
    status: "Ready",
    reason: "Account approval, profile moderation, visibility, and lifecycle are aligned for public viewing.",
    tone: "success" as const,
  };
}

function getNextAction(user: AuthUser | null | undefined, latestPost: MarketplacePost | null) {
  if (!user?.profile) {
    return { label: "Complete the public profile.", href: "/profile", cta: "Complete profile" };
  }

  if (user.approvalStatus !== "APPROVED") {
    return { label: "Wait for or request account approval.", href: "/profile", cta: "View status" };
  }

  if (user.profile.moderationStatus !== "APPROVED") {
    return { label: "Review profile moderation state.", href: "/profile", cta: "Open profile" };
  }

  if (!latestPost) {
    return { label: "Create the first marketplace post.", href: "/publish", cta: "Create post" };
  }

  if (postTone(latestPost) !== "success") {
    return { label: "Track latest post moderation.", href: "/publish", cta: "View post" };
  }

  return { label: "Review public presence and continue publishing.", href: "/publish", cta: "Manage posts" };
}

function lifecycleLabel(post: MarketplacePost) {
  if (post.visibility === "PRIVATE") {
    return "Draft";
  }

  if (post.moderationStatus === "REJECTED") {
    return "Rejected";
  }

  if (post.status === "LIVE" && post.moderationStatus === "APPROVED") {
    return "Live";
  }

  if (post.moderationStatus === "APPROVED") {
    return "Approved";
  }

  if (post.status === "ARCHIVED") {
    return "Archived";
  }

  return "Pending review";
}

function postTone(post: MarketplacePost): "success" | "warning" | "danger" | "neutral" {
  if (post.moderationStatus === "REJECTED") {
    return "danger";
  }

  if (post.status === "LIVE" && post.moderationStatus === "APPROVED") {
    return "success";
  }

  return post.visibility === "PRIVATE" ? "neutral" : "warning";
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function DashboardAction({
  title,
  description,
  href,
  cta,
  primary = false,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
  primary?: boolean;
}) {
  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-slate-50 p-5">
      <div className="text-lg font-semibold text-brand-charcoal">{title}</div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <Link
        href={href}
        prefetch={false}
        className={`mt-5 inline-flex rounded-2xl px-4 py-2 text-sm font-semibold ${
          primary
            ? "bg-brand-navy text-white"
            : "border border-slate-200 bg-white text-brand-navy"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function StatusCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "warning" | "danger" | "neutral";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "danger"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-800";

  return (
    <div className={`rounded-[1.4rem] border px-5 py-4 ${toneClassName}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.22em]">{label}</div>
      <div className="mt-2 text-lg font-semibold">{value}</div>
    </div>
  );
}
