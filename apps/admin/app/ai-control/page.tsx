"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type TaxonomySourceDocument = {
  id: string;
  name: string;
  source: string;
  locale: string;
  format: string;
  note: string;
};

type TaxonomyIndustry = {
  id: string;
  name: string;
  slug: string;
  source: string;
};

type TaxonomyCategory = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  source: string;
};

type TaxonomySkill = {
  name: string;
  relationType: "essential" | "optional";
  source: string;
};

type TaxonomyProfession = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  category: string;
  source: string;
  labels: {
    en: string;
    ro?: string;
  };
  descriptions: {
    en: string;
    ro?: string;
  };
  tags: string[];
  skills: TaxonomySkill[];
  mappings: {
    esco: string[];
    nace: string[];
    uniclass: string[];
  };
  references: {
    escoOccupation?: {
      code: string;
      label: string;
      uri?: string;
    };
    nace: Array<{
      code: string;
      label: string;
    }>;
    uniclass: Array<{
      code: string;
      label: string;
    }>;
    sourceFiles: string[];
  };
};

type TaxonomyTag = {
  id: string;
  name: string;
  slug: string;
};

type TaxonomyPayload = {
  sources: TaxonomySourceDocument[];
  industries: TaxonomyIndustry[];
  categories: TaxonomyCategory[];
  professions: TaxonomyProfession[];
  tags: TaxonomyTag[];
};

type LoadState = "loading" | "success" | "unauthorized" | "error";

export default function AIControlPage() {
  const [data, setData] = useState<TaxonomyPayload | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");

  useEffect(() => {
    let isMounted = true;

    async function loadTaxonomy() {
      setState("loading");
      setMessage(null);

      const result = await fetchApiJson<TaxonomyPayload>("/taxonomy");

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setData(null);
        setState(result.kind);
        setMessage(result.message);
        return;
      }

      setData(result.data);
      setState("success");
    }

    void loadTaxonomy();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProfessions = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return data.professions.filter((profession) => {
      const matchesIndustry =
        selectedIndustry === "all" || profession.industry === selectedIndustry;

      const matchesQuery =
        !normalizedQuery ||
        profession.name.toLowerCase().includes(normalizedQuery) ||
        profession.labels.en.toLowerCase().includes(normalizedQuery) ||
        profession.labels.ro?.toLowerCase().includes(normalizedQuery) ||
        profession.industry.toLowerCase().includes(normalizedQuery) ||
        profession.category.toLowerCase().includes(normalizedQuery) ||
        profession.descriptions.en.toLowerCase().includes(normalizedQuery) ||
        profession.descriptions.ro?.toLowerCase().includes(normalizedQuery) ||
        profession.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
        profession.skills.some((skill) =>
          skill.name.toLowerCase().includes(normalizedQuery),
        ) ||
        profession.mappings.esco.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery),
        ) ||
        profession.mappings.nace.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery),
        ) ||
        profession.mappings.uniclass.some((tag) =>
          tag.toLowerCase().includes(normalizedQuery),
        ) ||
        profession.references.sourceFiles.some((fileName) =>
          fileName.toLowerCase().includes(normalizedQuery),
        );

      return matchesIndustry && matchesQuery;
    });
  }, [data, query, selectedIndustry]);

  if (state === "loading") {
    return (
      <main className="p-8 text-white">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h1 className="text-2xl font-semibold">AI Control Center</h1>
          <p className="mt-3 text-slate-400">Loading taxonomy data...</p>
        </div>
      </main>
    );
  }

  if (state === "unauthorized") {
    return (
      <main className="p-8 text-white">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h1 className="text-2xl font-semibold text-amber-200">
            Autentificare necesara
          </h1>
          <p className="mt-3 text-amber-100">
            {message ?? "API-ul functioneaza, dar lipseste tokenul JWT."}
          </p>
        </div>
      </main>
    );
  }

  if (state === "error" || !data) {
    return (
      <main className="p-8 text-white">
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold text-rose-200">Eroare API</h1>
          <p className="mt-3 text-rose-100">
            {message ?? "Taxonomy API nu raspunde corect."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8 p-8 text-white">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-cyan-400">
          OpenStaff Intelligence
        </p>
        <h1 className="mt-2 text-3xl font-bold text-white">AI Control Center</h1>
        <p className="mt-3 max-w-4xl text-slate-400">
          Taxonomy integrata din ESCO, NACE, Uniclass si resurse romanesti
          pentru OpenStaff. Datele curente combina ocupatii reale, skill-uri,
          coduri de activitate si mapping-uri pentru industriile Construction,
          Tourism, Facilities si Retail.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Sources" value={data.sources.length} />
        <StatCard label="Industries" value={data.industries.length} />
        <StatCard label="Categories" value={data.categories.length} />
        <StatCard label="Professions" value={data.professions.length} />
        <StatCard label="Tags" value={data.tags.length} />
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              Search professions, skills, codes, or source files
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="chef, plumber, 4321, Ac_05_90, occupations_ro..."
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-300">
              Filter by industry
            </span>
            <select
              value={selectedIndustry}
              onChange={(event) => setSelectedIndustry(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500"
            >
              <option value="all">All industries</option>
              {data.industries.map((industry) => (
                <option key={industry.id} value={industry.slug}>
                  {industry.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-4">
        <Panel title="Integrated Sources">
          {data.sources.map((source) => (
            <Item
              key={source.id}
              title={source.name}
              meta={`${source.source} · ${source.locale} · ${source.format}`}
              description={source.note}
            />
          ))}
        </Panel>

        <Panel title="Industries">
          {data.industries.map((industry) => (
            <Item
              key={industry.id}
              title={industry.name}
              meta={`${industry.slug} · ${industry.source}`}
            />
          ))}
        </Panel>

        <Panel title="Categories">
          {data.categories.map((category) => (
            <Item
              key={category.id}
              title={category.name}
              meta={`${category.industry} · ${category.source}`}
            />
          ))}
        </Panel>

        <Panel title="Tags">
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200"
              >
                {tag.name}
              </span>
            ))}
          </div>
        </Panel>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Professions</h2>
            <p className="text-sm text-slate-400">
              {filteredProfessions.length} result(s)
            </p>
          </div>
        </div>

        {filteredProfessions.length === 0 ? (
          <div className="rounded-xl bg-slate-950 p-6 text-sm text-slate-400">
            Nu exista profesii pentru filtrul selectat.
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredProfessions.map((profession) => (
              <article
                key={profession.id}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-white">{profession.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {profession.labels.en}
                      {profession.labels.ro ? ` / ${profession.labels.ro}` : ""}
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {profession.industry} · {profession.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
                    {profession.source}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-300">
                  {profession.descriptions.en}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {profession.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Source mappings
                    </p>
                    <div className="mt-2 space-y-2 text-xs text-slate-300">
                      <div>ESCO: {profession.mappings.esco.join(", ")}</div>
                      <div>NACE: {profession.mappings.nace.join(", ")}</div>
                      <div>Uniclass: {profession.mappings.uniclass.join(", ")}</div>
                    </div>
                    {profession.references.escoOccupation ? (
                      <p className="mt-3 text-xs text-slate-400">
                        ESCO URI: {profession.references.escoOccupation.uri}
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Skills
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {profession.skills.map((skill) => (
                        <span
                          key={`${profession.id}-${skill.name}`}
                          className={`rounded-full px-3 py-1 text-xs ${
                            skill.relationType === "essential"
                              ? "bg-cyan-500/15 text-cyan-200"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Integrated source files
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profession.references.sourceFiles.map((fileName) => (
                      <span
                        key={`${profession.id}-${fileName}`}
                        className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-400"
                      >
                        {fileName}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-white">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Item({
  title,
  meta,
  description,
}: {
  title: string;
  meta: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl bg-slate-950 p-4">
      <p className="font-medium text-white">{title}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
        {meta}
      </p>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
      ) : null}
    </div>
  );
}
