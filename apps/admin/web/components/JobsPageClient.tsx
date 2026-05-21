"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import JobCard from "@/components/JobCard";
import { getMarketplaceFeed, type MarketplacePost } from "@/lib/api";

const CATEGORY_OPTIONS = [
  "",
  "DATA_CENTER",
  "PHOTOVOLTAIC",
  "HORECA",
  "ENVIRONMENT",
  "CONSTRUCTION",
  "PCB_DESIGN",
];

export default function JobsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<MarketplacePost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(
    () => ({
      category: searchParams.get("category") || "",
      region: searchParams.get("region") || "",
      nace: searchParams.get("nace") || "",
      page: Number(searchParams.get("page") || "1"),
      limit: 9,
    }),
    [searchParams],
  );

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    getMarketplaceFeed({ type: "PROJECT", status: "LIVE" }).then((response) => {
      if (!mounted) {
        return;
      }

      const filtered = response.data.filter((job: MarketplacePost) => {
        const normalizedCategory = filters.category.replaceAll("_", " ");
        const matchesCategory =
          !filters.category || job.domain.toUpperCase().includes(normalizedCategory);
        const matchesRegion =
          !filters.region ||
          job.location.toLowerCase().includes(filters.region.toLowerCase());
        const matchesNace =
          !filters.nace ||
          (job.naceCodes ?? []).some((entry: string) => entry.includes(filters.nace));

        return matchesCategory && matchesRegion && matchesNace;
      });

      const start = (filters.page - 1) * filters.limit;
      const end = start + filters.limit;
      setJobs(filtered.slice(start, end));
      setTotal(filtered.length);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [filters]);

  function updateQuery(
    next: Partial<{ category: string; region: string; nace: string; page: number }>,
  ) {
    const query = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        query.delete(key);
      } else {
        query.set(key, String(value));
      }
    });

    if (next.page === undefined) {
      query.set("page", "1");
    }

    router.push(`/jobs?${query.toString()}`);
  }

  const hasPrev = filters.page > 1;
  const hasNext = filters.page * filters.limit < total;

  return (
    <main style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 64px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px minmax(0, 1fr)",
          gap: 24,
        }}
      >
        <aside
          style={{
            background: "white",
            borderRadius: 16,
            padding: 20,
            height: "fit-content",
            border: "1px solid #E8EBF5",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              color: "#1B2A6B",
              fontWeight: 800,
              margin: "0 0 18px",
            }}
          >
            Project filters
          </h1>

          <div style={{ display: "grid", gap: 14 }}>
            <label>
              <div style={{ fontSize: 13, color: "#8892B0", marginBottom: 6 }}>Category</div>
              <select
                value={filters.category}
                onChange={(event) =>
                  updateQuery({ category: event.target.value || "", page: 1 })
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #E8EBF5",
                }}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "All"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#8892B0", marginBottom: 6 }}>Region</div>
              <input
                value={filters.region}
                onChange={(event) => updateQuery({ region: event.target.value, page: 1 })}
                placeholder="Example: Bucharest, Cluj, Timis"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #E8EBF5",
                }}
              />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#8892B0", marginBottom: 6 }}>NACE</div>
              <input
                value={filters.nace}
                onChange={(event) => updateQuery({ nace: event.target.value, page: 1 })}
                placeholder="Example: 43.21"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid #E8EBF5",
                }}
              />
            </label>
          </div>
        </aside>

        <section>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: 0 }}>
                Active projects and requests
              </h2>
              <p style={{ color: "#8892B0", margin: "8px 0 0" }}>{total} results</p>
            </div>
            <Link
              href="/publish"
              prefetch={false}
              style={{ alignSelf: "center", color: "#00C060", fontWeight: 700 }}
            >
              Publish your listing
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>
              Loading marketplace projects...
            </div>
          ) : jobs.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "#8892B0",
                background: "white",
                borderRadius: 16,
              }}
            >
              No projects matched the current filters.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 20,
              }}
            >
              {jobs.map((job) => (
                <JobCard key={job.id} {...job} />
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
            <button
              onClick={() => hasPrev && updateQuery({ page: filters.page - 1 })}
              disabled={!hasPrev}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #E8EBF5",
                background: "white",
                color: "#1B2A6B",
                opacity: hasPrev ? 1 : 0.45,
              }}
            >
              Previous
            </button>
            <div style={{ color: "#8892B0", alignSelf: "center" }}>Page {filters.page}</div>
            <button
              onClick={() => hasNext && updateQuery({ page: filters.page + 1 })}
              disabled={!hasNext}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "1px solid #E8EBF5",
                background: "white",
                color: "#1B2A6B",
                opacity: hasNext ? 1 : 0.45,
              }}
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
