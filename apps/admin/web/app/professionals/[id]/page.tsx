"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getApiUrl,
  getMarketplaceProfessional,
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

export default function ProfessionalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, canStartPrivateChat, remainingPrivateContacts, subscription } = useAuth();
  const [post, setPost] = useState<MarketplacePost | null>(null);
  const [source, setSource] = useState<"api" | "fallback" | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      if (!params?.id) {
        if (mounted) {
          setState("missing");
        }
        return;
      }

      setState("loading");
      const result = await getMarketplaceProfessional(params.id);

      if (!mounted) {
        return;
      }

      setPost(result.data);
      setSource(result.source);
      setState(result.data ? "ready" : "missing");
    }

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [params?.id]);

  const bannerMedia = useMemo(() => {
    const candidate =
      post?.mediaAssets?.find((item) => item.role === "BANNER") ??
      post?.mediaAssets?.find((item) => item.role === "PHOTO") ??
      post?.mediaAssets?.[0] ??
      null;

    return candidate
      ? {
          ...candidate,
          absoluteUrl: assetUrl(candidate.assetUrl),
        }
      : null;
  }, [post]);

  if (state === "loading") {
    return (
      <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>
        Loading professional profile...
      </main>
    );
  }

  if (state === "missing" || !post) {
    return (
      <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>
        This profile could not be found.
      </main>
    );
  }

  const portrait =
    post.mediaAssets?.find((item) => item.role === "PHOTO") ??
    post.mediaAssets?.find((item) => item.role === "GALLERY") ??
    null;
  const approvedLinks =
    post.externalLinks?.filter((item) => item.securityStatus === "APPROVED") ?? [];

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 64px" }}>
      <Link
        href="/professionals"
        style={{ color: "#00C060", fontWeight: 700, textDecoration: "none" }}
      >
        Back to professionals
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
          Live marketplace profile data is temporarily unavailable. You are seeing the legacy
          fallback profile for this professional entry.
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
        {bannerMedia?.absoluteUrl ? (
          bannerMedia.type === "VIDEO" ? (
            <video
              src={bannerMedia.absoluteUrl}
              controls
              style={{ width: "100%", maxHeight: 320, objectFit: "cover", background: "#0F172A" }}
            />
          ) : (
            <div
              style={{
                minHeight: 220,
                backgroundImage: `linear-gradient(140deg, rgba(27,42,107,0.32), rgba(0,232,122,0.14)), url(${bannerMedia.absoluteUrl})`,
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
              gap: 24,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            {portrait?.assetUrl ? (
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  backgroundImage: `url(${assetUrl(portrait.assetUrl)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "4px solid #E2FBEA",
                }}
              />
            ) : (
              <div
                style={{
                  width: 92,
                  height: 92,
                  borderRadius: "50%",
                  background: "#1B2A6B",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 34,
                  fontWeight: 800,
                }}
              >
                {(post.title || "?").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <Pill label={post.type === "SUBCONTRACTOR_POOL" ? "Subcontractor Pool" : "Professional"} tone="green" />
                <Pill label={post.status} tone="navy" />
                {post.domain ? <Pill label={post.domain} tone="slate" /> : null}
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
              <div style={{ color: "#64748B", display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span>{post.ownerType || "Marketplace professional"}</span>
                <span>{post.location || "Location to be confirmed"}</span>
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
                ? "Create account to connect"
                : canStartPrivateChat
                  ? "Use your account to connect"
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
                  View upgrade options
                </Link>
              </div>
            </div>
          ) : null}

          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 24,
              gridTemplateColumns: "minmax(0, 1.7fr) minmax(300px, 1fr)",
            }}
          >
            <div>
              <SectionTitle>Public summary</SectionTitle>
              <div style={{ color: "#334155", lineHeight: 1.85 }}>
                {post.summary || post.description || "No public summary is available yet."}
              </div>

              <SectionTitle>Capabilities</SectionTitle>
              <TagRow label="ESCO" values={post.escoCodes ?? []} emptyLabel="No ESCO mapping yet." />
              <TagRow label="NACE" values={post.naceCodes ?? []} emptyLabel="No NACE mapping yet." />
              <TagRow
                label="Uniclass"
                values={post.uniclassCodes ?? []}
                emptyLabel="No Uniclass mapping yet."
              />
              <TagRow
                label="Languages"
                values={post.languageCodes ?? []}
                emptyLabel="No language preferences listed."
              />

              <SectionTitle>Experience and certifications</SectionTitle>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
                <InfoCard title="Experience" content={post.experienceLabel || "Experience not specified."} />
                <InfoCard
                  title="Certifications"
                  content={post.certifications || "No public certifications listed."}
                />
              </div>

              <SectionTitle>Portfolio and documents</SectionTitle>
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
                        {document.fileName} · {Math.max(1, Math.round(document.sizeBytes / 1024))} KB
                      </div>
                      {document.description ? (
                        <div style={{ marginTop: 6, color: "#475569" }}>{document.description}</div>
                      ) : null}
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyBox message="No public documents or portfolio files are attached yet." />
              )}
            </div>

            <aside>
              <SectionTitle>Marketplace metadata</SectionTitle>
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
                <SidebarRow label="Value" value={post.value || "Flexible"} />
                <SidebarRow
                  label="Moderation"
                  value={post.moderationStatus || "Approved marketplace content"}
                />
              </div>

              <SectionTitle>Verified external links</SectionTitle>
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
                <EmptyBox message="No verified external references are available." />
              )}

              <SectionTitle>Gallery</SectionTitle>
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
                <EmptyBox message="No approved profile media is available yet." />
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "navy" | "slate";
}) {
  const styles = {
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
        ...styles[tone],
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

function TagRow({
  label,
  values,
  emptyLabel,
}: {
  label: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: "#64748B", fontWeight: 700, marginBottom: 8 }}>{label}</div>
      {values.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {values.map((value) => (
            <span
              key={`${label}-${value}`}
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
        <EmptyBox message={emptyLabel} compact />
      )}
    </div>
  );
}

function InfoCard({ title, content }: { title: string; content: string }) {
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
