"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ActorCard from "@/components/ActorCard";
import GeminiChatbot from "@/components/GeminiChatbot";
import JobCard from "@/components/JobCard";
import {
  MarketplacePost,
  getMarketplaceProfessionals,
  getMarketplaceProjects,
  trackRolloutFunnelEvent,
} from "@/lib/api";

const CATEGORIES = [
  { key: "DATA_CENTER", label: "Data Center", accent: "#3B82F6" },
  { key: "PHOTOVOLTAIC", label: "Photovoltaic", accent: "#F59E0B" },
  { key: "HORECA", label: "HoReCa", accent: "#EF4444" },
  { key: "ENVIRONMENT", label: "Environment", accent: "#10B981" },
  { key: "CONSTRUCTION", label: "Construction", accent: "#8B5CF6" },
  { key: "PCB_DESIGN", label: "PCB Design", accent: "#06B6D4" },
];

export default function HomePage() {
  const [projects, setProjects] = useState<MarketplacePost[]>([]);
  const [professionals, setProfessionals] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void trackRolloutFunnelEvent({
      eventType: "LANDING_PAGE_VISIT",
      surface: "homepage",
      sourceId: "openstaff-homepage",
      dedupeKey: "homepage-landing-visit",
    });

    let cancelled = false;

    Promise.all([getMarketplaceProjects(6), getMarketplaceProfessionals(8)])
      .then(([projectsResponse, professionalsResponse]) => {
        if (cancelled) {
          return;
        }

        setProjects(projectsResponse.data);
        setProfessionals(professionalsResponse.data);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ background: "#F4F7FB", minHeight: "100vh" }}>
      <section
        style={{
          background:
            "radial-gradient(circle at top left, rgba(0,232,122,0.16), transparent 30%), linear-gradient(135deg, #12214F 0%, #1B2A6B 55%, #243A92 100%)",
          padding: "88px 24px 72px",
          color: "white",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gap: 28,
            alignItems: "center",
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <div
              style={{
                display: "inline-flex",
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Approved marketplace visibility
            </div>
            <h1 style={{ fontSize: 52, lineHeight: 1.05, fontWeight: 800, margin: "18px 0 0" }}>
              Real companies, approved professionals, and live project demand in one marketplace.
            </h1>
            <p style={{ fontSize: 19, opacity: 0.88, marginTop: 20, maxWidth: 680, lineHeight: 1.7 }}>
              OpenStaff helps companies and professionals create trusted profiles, publish work,
              and appear publicly only after moderation. What you see here is the approved feed,
              not placeholder launch content.
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/jobs"
              style={{
                background: "#00E87A",
                color: "#12214F",
                padding: "14px 28px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Explore live projects
            </Link>
            <Link
              href="/register"
              style={{
                background: "transparent",
                color: "white",
                padding: "14px 28px",
                borderRadius: 12,
                fontWeight: 700,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.26)",
              }}
            >
              Create your account
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: "42px 24px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
          {CATEGORIES.map((category) => (
            <Link
              key={category.key}
              href={`/jobs?category=${category.key}`}
              style={{
                background: "white",
                borderRadius: 16,
                padding: "22px 18px",
                textDecoration: "none",
                boxShadow: "0 2px 10px rgba(15,23,42,0.05)",
                border: "1px solid #DCE5F5",
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: category.accent,
                  marginBottom: 12,
                }}
              />
              <div style={{ color: "#12214F", fontWeight: 700, fontSize: 15 }}>{category.label}</div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ padding: "24px 24px 56px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "#00A260", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Approved project feed
            </div>
            <h2 style={{ color: "#12214F", fontSize: 30, fontWeight: 800, marginTop: 6 }}>
              Projects open for delivery
            </h2>
          </div>
          <Link href="/jobs" style={{ color: "#12214F", fontWeight: 700, textDecoration: "none" }}>
            View all projects
          </Link>
        </div>

        {loading ? (
          <div style={{ color: "#64748B", textAlign: "center", padding: 48 }}>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div
            style={{
              color: "#475569",
              textAlign: "center",
              padding: 40,
              background: "white",
              borderRadius: 18,
              border: "1px solid #DCE5F5",
            }}
          >
            There are no approved public projects yet. As soon as a listing passes moderation, it
            will appear here.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 20,
            }}
          >
            {projects.map((job) => (
              <JobCard key={job.id} {...job} />
            ))}
          </div>
        )}
      </section>

      <section style={{ background: "white", padding: "56px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: "#00A260", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Approved public profiles
              </div>
              <h2 style={{ color: "#12214F", fontSize: 30, fontWeight: 800, marginTop: 6 }}>
                Companies and professionals ready to be discovered
              </h2>
            </div>
            <Link
              href="/professionals"
              style={{ color: "#12214F", fontWeight: 700, textDecoration: "none" }}
            >
              Browse all profiles
            </Link>
          </div>

          {loading ? (
            <div style={{ color: "#64748B", textAlign: "center", padding: 48 }}>Loading profiles...</div>
          ) : professionals.length === 0 ? (
            <div
              style={{
                color: "#475569",
                textAlign: "center",
                padding: 40,
                background: "#F8FAFC",
                borderRadius: 18,
                border: "1px solid #DCE5F5",
              }}
            >
              Approved company and professional profiles will appear here after moderation.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 16,
              }}
            >
              {professionals.map((actor) => (
                <ActorCard key={actor.id} {...actor} />
              ))}
            </div>
          )}
        </div>
      </section>

      <GeminiChatbot />
    </div>
  );
}
