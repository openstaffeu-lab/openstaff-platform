"use client";

import { useEffect, useState } from "react";
import { searchEsco } from "@/lib/api";

export default function EscoMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      const data = await searchEsco(query);
      setResults(data.results || []);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Caută ocupații ESCO"
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1.5px solid #E8EBF5",
          fontSize: 14,
          color: "#1B2A6B",
          outline: "none",
          boxSizing: "border-box",
        }}
      />

      {value.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {value.map((item) => (
            <button
              key={item}
              onClick={() => onChange(value.filter((entry) => entry !== item))}
              style={{
                border: "1px solid #00E87A",
                background: "#EFFFF7",
                color: "#1B2A6B",
                borderRadius: 999,
                padding: "6px 10px",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {item} ✕
            </button>
          ))}
        </div>
      ) : null}

      {results.length > 0 ? (
        <div style={{ border: "1px solid #E8EBF5", borderRadius: 10, overflow: "hidden" }}>
          {results.map((result) => {
            const label = result.label || result.code;
            const selected = value.includes(label);

            return (
              <button
                key={result.id || result.code}
                onClick={() => {
                  if (!selected) {
                    onChange([...value, label]);
                  }
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: selected ? "#F0F2F8" : "white",
                  border: "none",
                  borderBottom: "1px solid #F0F2F8",
                  color: "#1B2A6B",
                  fontSize: 13,
                }}
              >
                <strong>{result.code}</strong> — {label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
