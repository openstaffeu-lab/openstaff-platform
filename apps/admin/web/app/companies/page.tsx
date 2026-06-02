"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ActorCard from "@/components/ActorCard";
import { MarketplacePost, getMarketplaceProfessionals } from "@/lib/api";

function isCompanyProfile(post: MarketplacePost) {
  const searchable = [
    post.type,
    post.ownerType,
    post.domain,
    post.title,
    post.description,
    post.summary,
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLowerCase();

  return /\b(company|contractor|subcontractor|supplier|business|pool)\b/.test(searchable);
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<MarketplacePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketplaceProfessionals().then((response) => {
      const companyProfiles = response.data.filter(isCompanyProfile);
      setCompanies(companyProfiles.length > 0 ? companyProfiles : response.data);
      setLoading(false);
    });
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ color: "#1B2A6B", fontSize: 32, fontWeight: 800, margin: "0 0 12px" }}>
            Companies and subcontractor pools
          </h1>
          <p style={{ color: "#8892B0", margin: 0 }}>
            Explore approved company, contractor, supplier, and subcontractor profiles.
          </p>
        </div>
        <Link
          href="/publish"
          prefetch={false}
          style={{ color: "#00C060", fontWeight: 700, textDecoration: "none", alignSelf: "center" }}
        >
          Publish your listing
        </Link>
      </div>

      {loading ? (
        <div style={{ color: "#8892B0", textAlign: "center", padding: 48 }}>
          Loading companies...
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {companies.map((company) => (
            <ActorCard key={company.id} {...company} />
          ))}
        </div>
      )}
    </main>
  );
}
