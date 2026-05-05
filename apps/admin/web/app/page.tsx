"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getActors, getJobs } from "@/lib/api";
import ActorCard from "@/components/ActorCard";
import GeminiChatbot from "@/components/GeminiChatbot";
import JobCard from "@/components/JobCard";

const CATEGORIES = [
  { key: "DATA_CENTER", label: "Data Center", color: "#3B82F6", icon: "🖥" },
  { key: "PHOTOVOLTAIC", label: "Fotovoltaic", color: "#F59E0B", icon: "☀" },
  { key: "HORECA", label: "HoReCa", color: "#EF4444", icon: "🍽" },
  { key: "ENVIRONMENT", label: "Mediu", color: "#10B981", icon: "🌿" },
  { key: "CONSTRUCTION", label: "Construcții", color: "#8B5CF6", icon: "🏗" },
  { key: "PCB_DESIGN", label: "PCB Design", color: "#06B6D4", icon: "⚡" },
];

export default function HomePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getJobs({ status: "LIVE", limit: 6 }), getActors({ verified: true })]).then(
      ([jobsResponse, actorsResponse]) => {
        setJobs(jobsResponse.data || []);
        setActors(actorsResponse.data || []);
        setLoading(false);
      },
    );
  }, []);

  return (
    <div style={{ background: "var(--os-bg, #F0F2F8)", minHeight: "100vh" }}>
      <section
        style={{
          background: "linear-gradient(135deg, #1B2A6B 0%, #2A3F9F 100%)",
          padding: "80px 24px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 48, fontWeight: 800, marginBottom: 16 }}>
          The Structure for <span style={{ color: "#00E87A" }}>Global Work.</span>
        </h1>
        <p style={{ fontSize: 20, opacity: 0.85, marginBottom: 32 }}>
          Conectăm profesioniști verificați cu proiecte reale în Europa
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/jobs"
            style={{
              background: "#00E87A",
              color: "#1B2A6B",
              padding: "14px 32px",
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 16,
            }}
          >
            Explorează Proiecte
          </Link>
          <Link
            href="/register"
            style={{
              background: "transparent",
              color: "white",
              padding: "14px 32px",
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 16,
              border: "2px solid #00E87A",
            }}
          >
            Înregistrează-te
          </Link>
        </div>
      </section>

      <section style={{ padding: "48px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
          Domenii de activitate
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 16,
          }}
        >
          {CATEGORIES.map((category) => (
            <Link
              key={category.key}
              href={`/jobs?category=${category.key}`}
              style={{
                background: "white",
                borderRadius: 12,
                padding: "24px 16px",
                textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: "2px solid transparent",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{category.icon}</div>
              <div style={{ color: category.color, fontWeight: 700, fontSize: 14 }}>{category.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: "0 24px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
          <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 700 }}>Proiecte active</h2>
          <Link href="/jobs" style={{ color: "#00E87A", fontWeight: 600, textDecoration: "none" }}>
            Vezi toate →
          </Link>
        </div>
        {loading ? (
          <div style={{ color: "#8892B0", textAlign: "center", padding: 48 }}>Se încarcă proiectele...</div>
        ) : jobs.length === 0 ? (
          <div style={{ color: "#8892B0", textAlign: "center", padding: 48 }}>
            Nu există proiecte active momentan. Fii primul!
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 20,
            }}
          >
            {jobs.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        )}
      </section>

      <section style={{ background: "white", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 12 }}>
            <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 700 }}>Profesioniști verificați</h2>
            <Link
              href="/professionals"
              style={{ color: "#00E87A", fontWeight: 600, textDecoration: "none" }}
            >
              Vezi toți →
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {actors.slice(0, 8).map((actor) => (
              <ActorCard key={actor.id} {...actor} />
            ))}
          </div>
        </div>
      </section>

      <GeminiChatbot />
    </div>
  );
}
