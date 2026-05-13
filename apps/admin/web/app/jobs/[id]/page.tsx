"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getApiUrl,
  getMarketplaceProject,
  type MarketplacePost,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

type LoadState = "loading" | "ready" | "missing";

function assetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function moneyRange(
  currencyCode?: string | null,
  min?: number | null,
  max?: number | null,
) {
  if (typeof min !== "number" && typeof max !== "number") {
    return null;
  }

  const values = [min, max]
    .filter((value): value is number => typeof value === "number")
    .map((value) => Number(value).toLocaleString("ro-RO"));

  return `${currencyCode || "EUR"} ${values.join(" - ")}`;
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, canStartPrivateChat, remainingPrivateContacts, subscription } = useAuth();
  const [post, setPost] = useState<MarketplacePost | null>(null);
  const [source, setSource] = useState<"api" | "fallback" | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let mounted = true;

    async function loadProject() {
      if (!params?.id) {
        if (mounted) {
          setState("missing");
        }
        return;
      }

      setState("loading");

      const result = await getMarketplaceProject(params.id);

      if (!mounted) {
        return;
      }

      setPost(result.data);
      setSource(result.source);
      setState(result.data ? "ready" : "missing");
    }

    void loadProject();

    return () => {
      mounted = false;
    };
  }, [params?.id]);

  const heroMedia = useMemo(() => {
    if (!post) {
      return null;
    }

    const preferred =
      post.mediaAssets?.find((item) => item.role === "BANNER") ??
      post.mediaAssets?.[0] ??
      null;

    return preferred
      ? {
          ...preferred,
          absoluteUrl: assetUrl(preferred.assetUrl),
        }
      : null;
  }, [post]);

  const budgetLabel = useMemo(
    () => moneyRange(post?.currencyCode, post?.budgetMin, post?.budgetMax),
    [post?.budgetMin, post?.budgetMax, post?.currencyCode],
  );

  const salaryLabel = useMemo(
    () => moneyRange(post?.currencyCode, post?.salaryMin, post?.salaryMax),
    [post?.salaryMin, post?.salaryMax, post?.currencyCode],
  );

  if (state === "loading") {
    return (
      <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>
        Loading marketplace project...
      </main>
    );
  }

  if (state === "missing" || !post) {
    return (
      <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>
        This project could not be found.
      </main>
    );
  }

  const approvedLinks =
    post.externalLinks?.filter((item) => item.securityStatus === "APPROVED") ?? [];

  return (
    <main style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 64px" }}>
      <Link
        href="/jobs"
        style={{ color: "#00C060", fontWeight: 700, textDecoration: "none" }}
      >
        Back to projects
      </Link>

      {source === "fallback" ? (
        <div
          style={{
            marginTop: 16,
            borderRadius: 14,
            border: "1px solid #FDE68A",
            background: "#FFFBEB",
            color: "#92400E",
            padding: "14px 16px",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Live marketplace data is temporarily unavailable. You are seeing the legacy fallback
          feed for this project.
        </div>
      ) : null}

      <section
        style={{
          marginTop: 16,
          background: "white",
          borderRadius: 24,
          border: "1px solid #E8EBF5",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(15,23,42,0.08)",
        }}
      >
        {heroMedia?.absoluteUrl ? (
          heroMedia.type === "VIDEO" ? (
            <video
              src={heroMedia.absoluteUrl}
              controls
              style={{ width: "100%", maxHeight: 360, objectFit: "cover", background: "#0F172A" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                minHeight: 280,
                backgroundImage: `linear-gradient(120deg, rgba(27,42,107,0.28), rgba(0,232,122,0.12)), url(${heroMedia.absoluteUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )
        ) : null}

        <div style={{ padding: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <StatusPill label={post.domain || "Marketplace Project"} tone="navy" />
                <StatusPill label={post.status} tone="green" />
                <StatusPill
                  label={post.type === "PROJECT" ? "Active Project" : post.type}
                  tone="slate"
                />
              </div>
              <h1
                style={{
                  color: "#1B2A6B",
                  fontSize: 34,
                  fontWeight: 800,
                  margin: "0 0 10px",
                }}
              >
                {post.title}
              </h1>
              <div style={{ color: "#8892B0", display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span>{post.location || "Location to be confirmed"}</span>
                <span>{post.ownerName}</span>
                {post.experienceLabel ? <span>{post.experienceLabel}</span> : null}
              </div>
            </div>

            <button
              onClick={() => {
                if (!token) {
                  router.push("/register");
                  return;
                }

                if (!canStartPrivateChat) {
                  return;
                }

                router.push("/profile");
              }}
              style={{
                alignSelf: "flex-start",
                background: !token || canStartPrivateChat ? "#1B2A6B" : "#94A3B8",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "14px 22px",
                fontWeight: 700,
                cursor: !token || canStartPrivateChat ? "pointer" : "not-allowed",
              }}
              disabled={Boolean(token) && !canStartPrivateChat}
            >
              {!token
                ? "Create account to respond"
                : canStartPrivateChat
                  ? "Open your profile to respond"
                  : "Private contact limit reached"}
            </button>
          </div>

          {token && !canStartPrivateChat ? (
            <div
              style={{
                marginTop: 16,
                borderRadius: 14,
                border: "1px solid #FDE68A",
                background: "#FFFBEB",
                color: "#92400E",
                padding: "14px 16px",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Your current plan ({subscription?.planName ?? "No active plan"}) has no private
              contacts remaining.
              {remainingPrivateContacts !== null
                ? ` Contacts left this period: ${remainingPrivateContacts}.`
                : ""}
              <div style={{ marginTop: 10 }}>
                  <Link
                    href="/pricing?reason=private-contact-limit&plan=BRONZE"
                    style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    borderRadius: 999,
                    background: "#1B2A6B",
                    color: "white",
                    padding: "10px 14px",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Compare upgrade plans
                </Link>
              </div>
            </div>
          ) : null}

          {post.summary ? (
            <p style={{ marginTop: 20, color: "#475569", fontSize: 16, lineHeight: 1.8 }}>
              {post.summary}
            </p>
          ) : null}

          <div
            style={{
              marginTop: 24,
              display: "grid",
              gap: 14,
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            }}
          >
            <StatCard label="Budget" value={budgetLabel || "To be confirmed"} />
            <StatCard label="Salary / Value" value={salaryLabel || post.value || "Flexible"} />
            <StatCard label="VAT" value={typeof post.vatRate === "number" ? `${post.vatRate}%` : "N/A"} />
            <StatCard
              label="Fiscal metadata"
              value={
                post.fiscalMetadataJson && Object.keys(post.fiscalMetadataJson).length > 0
                  ? Object.entries(post.fiscalMetadataJson)
                      .map(([key, value]) => `${key}: ${String(value)}`)
                      .join(" | ")
                  : "No fiscal metadata"
              }
            />
          </div>

          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 24,
              gridTemplateColumns: "minmax(0, 1.8fr) minmax(300px, 1fr)",
            }}
          >
            <div>
              <SectionTitle>Project description</SectionTitle>
              <div
                style={{
                  color: "#334155",
                  lineHeight: 1.85,
                  whiteSpace: "pre-wrap",
                }}
              >
                {post.description || "No public project description is available yet."}
              </div>

              <SectionTitle>Classification</SectionTitle>
              <ChipGrid
                groups={[
                  { label: "ESCO", values: post.escoCodes ?? [] },
                  { label: "NACE", values: post.naceCodes ?? [] },
                  { label: "Uniclass", values: post.uniclassCodes ?? [] },
                  { label: "Languages", values: post.languageCodes ?? [] },
                ]}
              />

              <SectionTitle>Certifications</SectionTitle>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <InfoPanel
                  title="Required"
                  content={post.certifications || "No mandatory certifications specified."}
                />
                <InfoPanel
                  title="Offered / Supported"
                  content={
                    post.certificationsOffered || "No offered certifications or coverage listed."
                  }
                />
              </div>

              <SectionTitle>Documents</SectionTitle>
              {post.documents?.length ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {post.documents.map((document) => (
                    <a
                      key={document.id}
                      href={assetUrl(document.downloadUrl) ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        borderRadius: 14,
                        border: "1px solid #E8EBF5",
                        padding: "14px 16px",
                        textDecoration: "none",
                        color: "#1B2A6B",
                        background: "#F8FAFC",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>{document.title}</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "#64748B" }}>
                        {document.fileName} · {document.mimeType} ·{" "}
                        {Math.max(1, Math.round(document.sizeBytes / 1024))} KB
                      </div>
                      {document.description ? (
                        <div style={{ marginTop: 6, fontSize: 14, color: "#475569" }}>
                          {document.description}
                        </div>
                      ) : null}
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyBox message="No public documents have been attached to this project yet." />
              )}
            </div>

            <aside>
              <SectionTitle>Marketplace summary</SectionTitle>
              <div
                style={{
                  borderRadius: 18,
                  border: "1px solid #E8EBF5",
                  background: "#F8FAFC",
                  padding: 18,
                  display: "grid",
                  gap: 12,
                }}
              >
                <SidebarRow label="Country" value={post.country?.name || "Not specified"} />
                <SidebarRow label="Region" value={post.region?.name || "Not specified"} />
                <SidebarRow label="City" value={post.city?.name || "Not specified"} />
                <SidebarRow label="Visibility" value={post.visibility || "Public"} />
                <SidebarRow
                  label="Moderation"
                  value={post.moderationStatus || "Approved marketplace content"}
                />
              </div>

              <SectionTitle>External links</SectionTitle>
              {approvedLinks.length ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {approvedLinks.map((linkItem) => (
                    <a
                      key={linkItem.id}
                      href={linkItem.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        borderRadius: 14,
                        border: "1px solid #D5E6FF",
                        background: "#F0F7FF",
                        padding: "14px 16px",
                        color: "#1B2A6B",
                        textDecoration: "none",
                        fontWeight: 700,
                        wordBreak: "break-word",
                      }}
                    >
                      {linkItem.normalizedUrl || linkItem.url}
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyBox message="No verified external references are available for this project." />
              )}

              <SectionTitle>Media gallery</SectionTitle>
              {post.mediaAssets?.length ? (
                <div
                  style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  }}
                >
                  {post.mediaAssets.map((item) => {
                    const url = assetUrl(item.assetUrl);
                    if (!url) {
                      return null;
                    }

                    return item.type === "VIDEO" ? (
                      <video
                        key={item.id}
                        src={url}
                        controls
                        style={{
                          width: "100%",
                          aspectRatio: "1 / 1",
                          objectFit: "cover",
                          borderRadius: 14,
                          background: "#0F172A",
                        }}
                      />
                    ) : (
                      <div
                        key={item.id}
                        style={{
                          aspectRatio: "1 / 1",
                          borderRadius: 14,
                          backgroundImage: `url(${url})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          border: "1px solid #E8EBF5",
                        }}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyBox message="No approved media is available for this project yet." />
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "navy" | "slate";
}) {
  const styleMap = {
    green: { background: "#DCFCE7", color: "#166534" },
    navy: { background: "#1B2A6B", color: "#FFFFFF" },
    slate: { background: "#E2E8F0", color: "#334155" },
  } satisfies Record<string, { background: string; color: string }>;

  return (
    <span
      style={{
        borderRadius: 999,
        padding: "6px 12px",
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...styleMap[tone],
      }}
    >
      {label}
    </span>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        marginTop: 28,
        marginBottom: 14,
        color: "#1B2A6B",
        fontSize: 20,
        fontWeight: 800,
      }}
    >
      {children}
    </h2>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #E8EBF5",
        background: "#F8FAFC",
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          color: "#64748B",
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, color: "#0F172A", fontSize: 15, fontWeight: 700 }}>
        {value}
      </div>
    </div>
  );
}

function ChipGrid({
  groups,
}: {
  groups: Array<{ label: string; values: string[] }>;
}) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {groups.map((group) => (
        <div key={group.label}>
          <div style={{ color: "#64748B", fontWeight: 700, marginBottom: 8 }}>{group.label}</div>
          {group.values.length ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {group.values.map((value) => (
                <span
                  key={`${group.label}-${value}`}
                  style={{
                    borderRadius: 999,
                    background: "#EEF2FF",
                    color: "#1B2A6B",
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {value}
                </span>
              ))}
            </div>
          ) : (
            <EmptyBox message={`No ${group.label.toLowerCase()} tags specified.`} compact />
          )}
        </div>
      ))}
    </div>
  );
}

function InfoPanel({ title, content }: { title: string; content: string }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #E8EBF5",
        background: "#F8FAFC",
        padding: 16,
      }}
    >
      <div style={{ color: "#1B2A6B", fontWeight: 800, marginBottom: 8 }}>{title}</div>
      <div style={{ color: "#475569", lineHeight: 1.7 }}>{content}</div>
    </div>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
      }}
    >
      <span style={{ color: "#64748B", fontWeight: 700 }}>{label}</span>
      <span style={{ color: "#0F172A", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function EmptyBox({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px dashed #CBD5E1",
        background: "#F8FAFC",
        color: "#64748B",
        padding: compact ? "10px 12px" : "16px",
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}
