"use client";

import { useEffect, useRef, useState } from "react";
import { searchNace } from "@/lib/api";

export default function NaceSearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string, description: string) => void;
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      const data = await searchNace(query);
      setResults(data.results || []);
      setOpen(true);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  return (
    <div style={{ position: "relative" }}>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Caută cod NACE (ex: electric, construcții...)"
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
      {open && results.length > 0 ? (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            zIndex: 100,
            maxHeight: 240,
            overflowY: "auto",
            border: "1px solid #E8EBF5",
          }}
        >
          {results.map((result: any) => (
            <div
              key={result.code}
              onClick={() => {
                setQuery(`${result.code} — ${result.label}`);
                setOpen(false);
                onChange(result.code, result.label);
              }}
              style={{
                padding: "10px 14px",
                cursor: "pointer",
                fontSize: 13,
                color: "#1B2A6B",
                borderBottom: "1px solid #F0F2F8",
              }}
            >
              <span style={{ fontWeight: 700, color: "#00C060" }}>{result.code}</span>
              {" — "}
              {result.label}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
