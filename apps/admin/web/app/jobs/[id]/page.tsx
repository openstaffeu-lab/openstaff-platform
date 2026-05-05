"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { applyToJob, getJob } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function parseReluSummary(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!params?.id) {
      return;
    }

    getJob(params.id).then((response) => {
      setJob(response);
      setLoading(false);
    });
  }, [params?.id]);

  const reluSummary = useMemo(() => parseReluSummary(job?.reluSummary), [job?.reluSummary]);

  if (loading) {
    return <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>Se încarcă detaliile...</main>;
  }

  if (!job) {
    return <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>Jobul nu a fost găsit.</main>;
  }

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 64px" }}>
      <Link href="/jobs" style={{ color: "#00C060", fontWeight: 700, textDecoration: "none" }}>
        ← Înapoi la joburi
      </Link>

      <section style={{ marginTop: 16, background: "white", borderRadius: 20, padding: 28, border: "1px solid #E8EBF5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#00C060", fontWeight: 700, marginBottom: 8 }}>{job.category}</div>
            <h1 style={{ color: "#1B2A6B", fontSize: 34, fontWeight: 800, margin: "0 0 10px" }}>{job.title}</h1>
            <div style={{ color: "#8892B0" }}>
              {job.location || job.regionCode || "Locație nedefinită"} · {job.currency || "RON"}
              {job.budget ? ` ${Number(job.budget).toLocaleString("ro-RO")}` : ""}
            </div>
          </div>
          <button
            onClick={() => {
              if (!token) {
                router.push("/register");
                return;
              }
              setApplyOpen(true);
            }}
            style={{
              alignSelf: "flex-start",
              background: "#1B2A6B",
              color: "white",
              border: "none",
              borderRadius: 12,
              padding: "14px 22px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
        </div>

        <div style={{ marginTop: 24, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{job.description}</div>

        {reluSummary ? (
          <div style={{ marginTop: 24, background: "#F0F7FF", borderRadius: 16, padding: 20, border: "1px solid #D5E6FF" }}>
            <div style={{ color: "#1B2A6B", fontSize: 18, fontWeight: 800, marginBottom: 10 }}>Relu AI Summary</div>
            {reluSummary.rezumat ? <p style={{ color: "#334155", margin: "0 0 12px" }}>{reluSummary.rezumat}</p> : null}
            {Array.isArray(reluSummary.competenteNecesare) ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {reluSummary.competenteNecesare.map((skill: string) => (
                  <span
                    key={skill}
                    style={{ padding: "6px 10px", borderRadius: 999, background: "white", color: "#1B2A6B", fontSize: 12 }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {applyOpen ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.45)",
            display: "grid",
            placeItems: "center",
            padding: 20,
            zIndex: 1200,
          }}
        >
          <div style={{ width: "100%", maxWidth: 560, background: "white", borderRadius: 18, padding: 24 }}>
            <h2 style={{ color: "#1B2A6B", fontSize: 24, fontWeight: 800, margin: "0 0 12px" }}>Aplică la acest job</h2>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Scrie un mesaj scurt pentru angajator..."
              rows={6}
              style={{ width: "100%", borderRadius: 12, border: "1px solid #E8EBF5", padding: 14, color: "#1B2A6B" }}
            />
            {feedback ? <div style={{ marginTop: 12, color: feedback.startsWith("Succes") ? "#00C060" : "#EF4444" }}>{feedback}</div> : null}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button
                onClick={() => setApplyOpen(false)}
                style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E8EBF5", background: "white" }}
              >
                Anulează
              </button>
              <button
                onClick={async () => {
                  if (!params?.id) {
                    return;
                  }
                  setSubmitting(true);
                  setFeedback("");
                  try {
                    await applyToJob(params.id, message, token);
                    setFeedback("Succes: aplicația a fost trimisă.");
                    setApplyOpen(false);
                  } catch (error) {
                    setFeedback(error instanceof Error ? error.message : "Aplicarea a eșuat.");
                  } finally {
                    setSubmitting(false);
                  }
                }}
                disabled={submitting}
                style={{
                  padding: "10px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#00E87A",
                  color: "#1B2A6B",
                  fontWeight: 700,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Se trimite..." : "Trimite"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
