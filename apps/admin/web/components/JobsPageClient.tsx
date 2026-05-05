"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import JobCard from "@/components/JobCard";
import { getJobs } from "@/lib/api";

const CATEGORY_OPTIONS = ["", "DATA_CENTER", "PHOTOVOLTAIC", "HORECA", "ENVIRONMENT", "CONSTRUCTION", "PCB_DESIGN"];

export default function JobsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
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
    setLoading(true);
    getJobs({ ...filters, status: "LIVE" }).then((response) => {
      setJobs(response.data || []);
      setTotal(response.total || 0);
      setLoading(false);
    });
  }, [filters]);

  function updateQuery(next: Partial<{ category: string; region: string; nace: string; page: number }>) {
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
      <div style={{ display: "grid", gridTemplateColumns: "280px minmax(0, 1fr)", gap: 24 }}>
        <aside style={{ background: "white", borderRadius: 16, padding: 20, height: "fit-content", border: "1px solid #E8EBF5" }}>
          <h1 style={{ fontSize: 24, color: "#1B2A6B", fontWeight: 800, margin: "0 0 18px" }}>Filtre joburi</h1>

          <div style={{ display: "grid", gap: 14 }}>
            <label>
              <div style={{ fontSize: 13, color: "#8892B0", marginBottom: 6 }}>Categorie</div>
              <select
                value={filters.category}
                onChange={(event) => updateQuery({ category: event.target.value || "", page: 1 })}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E8EBF5" }}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "Toate"}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#8892B0", marginBottom: 6 }}>Regiune</div>
              <input
                value={filters.region}
                onChange={(event) => updateQuery({ region: event.target.value, page: 1 })}
                placeholder="Ex: B, CJ, TM"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E8EBF5" }}
              />
            </label>

            <label>
              <div style={{ fontSize: 13, color: "#8892B0", marginBottom: 6 }}>NACE</div>
              <input
                value={filters.nace}
                onChange={(event) => updateQuery({ nace: event.target.value, page: 1 })}
                placeholder="Ex: 43.21"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #E8EBF5" }}
              />
            </label>
          </div>
        </aside>

        <section>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: 0 }}>Proiecte și joburi active</h2>
              <p style={{ color: "#8892B0", margin: "8px 0 0" }}>{total} rezultate</p>
            </div>
            <Link href="/register" style={{ alignSelf: "center", color: "#00C060", fontWeight: 700 }}>
              Publică profilul tău
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>Se încarcă joburile...</div>
          ) : jobs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#8892B0", background: "white", borderRadius: 16 }}>
              Nu am găsit joburi pentru filtrele curente.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
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
              ← Prev
            </button>
            <div style={{ color: "#8892B0", alignSelf: "center" }}>Pagina {filters.page}</div>
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
              Next →
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
