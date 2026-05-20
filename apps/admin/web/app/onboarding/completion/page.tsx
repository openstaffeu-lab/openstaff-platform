"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  classifyProfileWithRelu,
  enrichProfileWithRelu,
  getVerificationMe,
  getOnboardingMe,
  getReluProfileResults,
  submitCompanyVerificationCase,
  submitIdentityVerificationCase,
  type ReluProfileResults,
  type VerificationMe,
  updateOnboardingStep,
} from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingCompletionPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { ready, reset } = useOnboardingState();
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof getOnboardingMe>> | null>(null);
  const [verification, setVerification] = useState<VerificationMe | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingIdentity, setSubmittingIdentity] = useState(false);
  const [submittingCompany, setSubmittingCompany] = useState(false);
  const [analyzingRelu, setAnalyzingRelu] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Record<string, boolean>>({});
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [reluResults, setReluResults] = useState<ReluProfileResults | null>(null);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [nextSnapshot, nextVerification] = await Promise.all([
          getOnboardingMe(token),
          getVerificationMe(token),
        ]);
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setVerification(nextVerification);
          setSelectedEvidence(createDefaultEvidenceSelection(nextVerification));
          setVerificationError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setVerificationError(
            error instanceof Error ? error.message : "Nu am putut incarca datele de verificare.",
          );
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, token]);

  if (!ready || !snapshot || !verification) {
    return null;
  }

  const evidenceSelection = toEvidencePayload(selectedEvidence);
  const evidenceCount =
    evidenceSelection.profileDocumentIds.length +
    evidenceSelection.actorDocumentIds.length +
    evidenceSelection.actorCertificationIds.length +
    evidenceSelection.medicalFitnessCertificateIds.length;
  const latestReluClassification = reluResults?.classifications?.[0] ?? null;
  const reluOutput = latestReluClassification?.outputData ?? {};
  const reluSuggestedSummary = [
    latestReluClassification?.explanation ?? null,
    Array.isArray(reluOutput.extractedRequirements) && reluOutput.extractedRequirements.length
      ? `Key signals: ${reluOutput.extractedRequirements.join(", ")}.`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 18 }}>
        <div>
          <div style={{ color: "#00C060", fontWeight: 700, fontSize: 13 }}>Profile completion</div>
          <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: "6px 0 0" }}>
            Profilul tau este aproape gata
          </h2>
        </div>

        <div style={{ display: "grid", gap: 12, color: "#334155" }}>
          <div><strong>Display name:</strong> {snapshot.identityProfile.displayName}</div>
          <div><strong>Public slug:</strong> /profiles/{snapshot.identityProfile.publicSlug}</div>
          <div><strong>Verification:</strong> {snapshot.identityProfile.verificationStatus}</div>
          <div><strong>Verification overall:</strong> {snapshot.verificationSummary.overallStatus}</div>
          <div><strong>Completion:</strong> {snapshot.completionPercent}%</div>
          <div><strong>Current step:</strong> {snapshot.onboardingSession.currentStep}</div>
          <div><strong>Completed steps:</strong> {snapshot.onboardingSession.completedSteps.join(", ") || "none"}</div>
          <div><strong>Company:</strong> {snapshot.companyProfile?.companyName ?? "not added"}</div>
          <div><strong>Identity case:</strong> {snapshot.verificationSummary.identityCase?.status ?? "not submitted"}</div>
          <div><strong>Company case:</strong> {snapshot.verificationSummary.companyCase?.status ?? "not submitted"}</div>
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#F8FAFC",
            border: "1px solid #E8EBF5",
            padding: 16,
            color: "#1E293B",
          }}
        >
          Profilul public nu expune emailul de autentificare, tokenuri sau alte date private.
          Dupa publicare si aprobare, doar informatiile destinate vizibilitatii publice vor fi
          afisate in marketplace.
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#F8FAFC",
            border: "1px solid #E8EBF5",
            padding: 16,
            color: "#1E293B",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 700, color: "#1B2A6B" }}>RELU AI profile generation</div>
          <div>
            RELU AI can analyze your current profile, attached evidence, and existing taxonomy to
            suggest profile positioning, categories, ESCO, and Uniclass mappings. You still review
            and edit every suggestion before anything becomes public.
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                if (!token || !snapshot.legacyProfile?.id) {
                  return;
                }

                setAnalyzingRelu(true);
                try {
                  await enrichProfileWithRelu(snapshot.legacyProfile.id, token);
                  await classifyProfileWithRelu(snapshot.legacyProfile.id, token);
                  const nextResults = await getReluProfileResults(snapshot.legacyProfile.id, token);
                  setReluResults(nextResults);
                } catch (error) {
                  setVerificationError(
                    error instanceof Error
                      ? error.message
                      : "RELU AI could not analyze the profile right now.",
                  );
                } finally {
                  setAnalyzingRelu(false);
                }
              }}
              disabled={analyzingRelu || !snapshot.legacyProfile?.id}
              style={primaryButton}
            >
              {analyzingRelu ? "Analyzing with RELU AI..." : "Analyzeaza cu RELU AI"}
            </button>
            <Link
              href="/profile"
              style={{
                ...secondaryButton,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Review editable profile draft
            </Link>
          </div>

          {latestReluClassification ? (
            <div
              style={{
                borderRadius: 14,
                background: "white",
                border: "1px solid #E8EBF5",
                padding: 16,
                display: "grid",
                gap: 10,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0F766E", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                Suggested by RELU AI
              </div>
              <div style={{ color: "#334155", lineHeight: 1.7 }}>
                {reluSuggestedSummary || "RELU AI analyzed the profile but did not produce a richer summary yet."}
              </div>
              <SuggestionRow
                label="ESCO"
                items={
                  Array.isArray(reluOutput.escoCandidates)
                    ? reluOutput.escoCandidates.map(
                        (item) =>
                          `${item.code} ${item.label}${item.confidence ? ` (${Math.round(item.confidence * 100)}%)` : ""}`,
                      )
                    : []
                }
              />
              <SuggestionRow
                label="NACE / Category"
                items={
                  Array.isArray(reluOutput.naceCandidates)
                    ? reluOutput.naceCandidates.map(
                        (item) =>
                          `${item.code} ${item.label}${item.confidence ? ` (${Math.round(item.confidence * 100)}%)` : ""}`,
                      )
                    : []
                }
              />
              <SuggestionRow
                label="Uniclass"
                items={
                  Array.isArray(reluOutput.uniclassCandidates)
                    ? reluOutput.uniclassCandidates.map(
                        (item) =>
                          `${item.code} ${item.label}${item.confidence ? ` (${Math.round(item.confidence * 100)}%)` : ""}`,
                      )
                    : []
                }
              />
              <SuggestionRow
                label="Missing information"
                items={Array.isArray(reluOutput.missingInformation) ? reluOutput.missingInformation : []}
              />
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Suggested by RELU AI only. You still decide what to keep, edit, or discard before
                anything reaches moderation or public visibility.
              </div>
            </div>
          ) : null}
        </div>

        <div
          style={{
            borderRadius: 16,
            background: "#F8FAFC",
            border: "1px solid #E8EBF5",
            padding: 16,
            color: "#1E293B",
          display: "grid",
          gap: 12,
        }}
      >
          <div style={{ fontWeight: 700, color: "#1B2A6B" }}>Verification workflow</div>
          <div>
            Din acest pas poti selecta documentele pe care vrei sa le trimiti pentru verificarea
            identitatii si, optional, a companiei. Cererile sunt revizuite manual de operatori in
            backoffice.
          </div>
          <div style={{ fontSize: 14, color: "#475569" }}>
            Evidence selectat: <strong>{evidenceCount}</strong>
          </div>
          {verificationError ? (
            <div
              style={{
                borderRadius: 12,
                border: "1px solid #FCA5A5",
                background: "#FEF2F2",
                color: "#991B1B",
                padding: 12,
              }}
            >
              {verificationError}
            </div>
          ) : null}
          <EvidenceGroup
            title="Profile documents"
            description="Documente generale legate de profilul public."
            items={verification.availableEvidence.profileDocuments.map((item) => ({
              id: `profile:${item.id}`,
              title: item.title,
              meta: [item.type, formatDate(item.createdAt)].filter(Boolean).join(" • "),
            }))}
            selectedEvidence={selectedEvidence}
            onToggle={(id) => {
              setSelectedEvidence((current) => ({ ...current, [id]: !current[id] }));
            }}
          />
          <EvidenceGroup
            title="Actor documents"
            description="Documente operationale sau de identitate disponibile deja in workspace-ul tau."
            items={verification.availableEvidence.actorDocuments.map((item) => ({
              id: `actor-document:${item.id}`,
              title: item.title,
              meta: [item.type, item.status, formatExpiry(item.expiresAt)].filter(Boolean).join(" • "),
            }))}
            selectedEvidence={selectedEvidence}
            onToggle={(id) => {
              setSelectedEvidence((current) => ({ ...current, [id]: !current[id] }));
            }}
          />
          <EvidenceGroup
            title="Certifications"
            description="Certificari profesionale care pot sustine profilul tau public."
            items={verification.availableEvidence.actorCertifications.map((item) => ({
              id: `actor-certification:${item.id}`,
              title: item.title,
              meta: [item.type, item.status, formatExpiry(item.expiresAt)].filter(Boolean).join(" • "),
            }))}
            selectedEvidence={selectedEvidence}
            onToggle={(id) => {
              setSelectedEvidence((current) => ({ ...current, [id]: !current[id] }));
            }}
          />
          <EvidenceGroup
            title="Medical fitness"
            description="Certificate medicale sau fitness relevante pentru eligibilitate si verificare."
            items={verification.availableEvidence.medicalFitnessCertificates.map((item) => ({
              id: `medical:${item.id}`,
              title: item.title,
              meta: [item.category, item.status, item.fitnessDecision, formatExpiry(item.expiresAt)]
                .filter(Boolean)
                .join(" • "),
            }))}
            selectedEvidence={selectedEvidence}
            onToggle={(id) => {
              setSelectedEvidence((current) => ({ ...current, [id]: !current[id] }));
            }}
          />
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                if (!token) {
                  return;
                }

                setSubmittingIdentity(true);
                try {
                  setVerificationError(null);
                  await submitIdentityVerificationCase(evidenceSelection, token);
                  const [nextSnapshot, nextVerification] = await Promise.all([
                    getOnboardingMe(token),
                    getVerificationMe(token),
                  ]);
                  setSnapshot(nextSnapshot);
                  setVerification(nextVerification);
                } finally {
                  setSubmittingIdentity(false);
                }
              }}
              disabled={submittingIdentity}
              style={secondaryButton}
            >
              {submittingIdentity ? "Se trimite..." : "Trimite verificarea identitatii"}
            </button>

            {snapshot.companyProfile ? (
              <button
                onClick={async () => {
                  if (!token) {
                    return;
                  }

                  setSubmittingCompany(true);
                  try {
                    setVerificationError(null);
                    await submitCompanyVerificationCase(evidenceSelection, token);
                    const [nextSnapshot, nextVerification] = await Promise.all([
                      getOnboardingMe(token),
                      getVerificationMe(token),
                    ]);
                    setSnapshot(nextSnapshot);
                    setVerification(nextVerification);
                  } finally {
                    setSubmittingCompany(false);
                  }
                }}
                disabled={submittingCompany}
                style={secondaryButton}
              >
                {submittingCompany ? "Se trimite..." : "Trimite verificarea companiei"}
              </button>
            ) : null}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button onClick={() => router.push("/onboarding/company")} style={secondaryButton}>
            Inapoi
          </button>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href={`/profiles/${snapshot.identityProfile.publicSlug}`}
              style={{
                ...secondaryButton,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Vezi profilul public
            </Link>
            <button
              onClick={async () => {
                if (!token) {
                  return;
                }

                setSaving(true);
                try {
                  await updateOnboardingStep(
                    {
                      currentStep: "completion",
                      completedStep: "completion",
                      status: "COMPLETED",
                    },
                    token,
                  );
                  reset();
                  router.push("/dashboard");
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              style={primaryButton}
            >
              {saving ? "Se finalizeaza..." : "Finalizeaza onboarding"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function SuggestionRow({ label, items }: { label: string; items: string[] }) {
  if (!items.length) {
    return null;
  }

  return (
    <div>
      <div style={{ fontWeight: 700, color: "#1B2A6B", marginBottom: 6 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {items.map((item) => (
          <span
            key={`${label}:${item}`}
            style={{
              borderRadius: 999,
              padding: "6px 10px",
              background: "#ECFDF5",
              border: "1px solid #A7F3D0",
              color: "#065F46",
              fontSize: 13,
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

const primaryButton: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "none",
  background: "#00E87A",
  color: "#1B2A6B",
  fontWeight: 700,
};

const secondaryButton: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 10,
  border: "1px solid #E8EBF5",
  background: "white",
  color: "#1B2A6B",
};

function EvidenceGroup({
  title,
  description,
  items,
  selectedEvidence,
  onToggle,
}: {
  title: string;
  description: string;
  items: Array<{ id: string; title: string; meta: string }>;
  selectedEvidence: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #E8EBF5",
        background: "white",
        padding: 14,
        display: "grid",
        gap: 10,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, color: "#1B2A6B" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{description}</div>
      </div>
      {items.length ? (
        items.map((item) => (
          <label
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "18px minmax(0, 1fr)",
              gap: 10,
              alignItems: "start",
              borderRadius: 12,
              border: "1px solid #E8EBF5",
              padding: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(selectedEvidence[item.id])}
              onChange={() => onToggle(item.id)}
              style={{ marginTop: 2 }}
            />
            <span style={{ display: "grid", gap: 4 }}>
              <span style={{ color: "#0F172A", fontWeight: 600 }}>{item.title}</span>
              <span style={{ color: "#64748B", fontSize: 13 }}>{item.meta}</span>
            </span>
          </label>
        ))
      ) : (
        <div style={{ color: "#64748B", fontSize: 14 }}>Nu exista elemente disponibile inca.</div>
      )}
    </div>
  );
}

function createDefaultEvidenceSelection(verification: VerificationMe) {
  const next: Record<string, boolean> = {};

  for (const item of verification.availableEvidence.profileDocuments) {
    next[`profile:${item.id}`] = true;
  }
  for (const item of verification.availableEvidence.actorDocuments) {
    next[`actor-document:${item.id}`] = true;
  }
  for (const item of verification.availableEvidence.actorCertifications) {
    next[`actor-certification:${item.id}`] = true;
  }
  for (const item of verification.availableEvidence.medicalFitnessCertificates) {
    next[`medical:${item.id}`] = true;
  }

  return next;
}

function toEvidencePayload(selectedEvidence: Record<string, boolean>) {
  const payload = {
    profileDocumentIds: [] as string[],
    actorDocumentIds: [] as string[],
    actorCertificationIds: [] as string[],
    medicalFitnessCertificateIds: [] as string[],
  };

  for (const [key, selected] of Object.entries(selectedEvidence)) {
    if (!selected) {
      continue;
    }

    const [prefix, id] = key.split(":");
    if (!id) {
      continue;
    }

    if (prefix === "profile") {
      payload.profileDocumentIds.push(id);
    } else if (prefix === "actor-document") {
      payload.actorDocumentIds.push(id);
    } else if (prefix === "actor-certification") {
      payload.actorCertificationIds.push(id);
    } else if (prefix === "medical") {
      payload.medicalFitnessCertificateIds.push(id);
    }
  }

  return payload;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

function formatExpiry(value: string | null) {
  if (!value) {
    return "";
  }

  return `expira ${formatDate(value)}`;
}
