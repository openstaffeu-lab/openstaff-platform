"use client";

import { useEffect, useState } from "react";
import ActorCard from "@/components/ActorCard";
import { getActors } from "@/lib/api";

export default function ProfessionalsPage() {
  const [actors, setActors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActors({ verified: true }).then((response) => {
      setActors(response.data || []);
      setLoading(false);
    });
  }, []);

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 64px" }}>
      <h1 style={{ color: "#1B2A6B", fontSize: 32, fontWeight: 800, margin: "0 0 12px" }}>Profesioniști verificați</h1>
      <p style={{ color: "#8892B0", margin: "0 0 24px" }}>
        Explorează profesioniști și companii validate pentru proiecte OpenStaff.
      </p>

      {loading ? (
        <div style={{ color: "#8892B0", textAlign: "center", padding: 48 }}>Se încarcă profesioniștii...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
          {actors.map((actor) => (
            <ActorCard key={actor.id} {...actor} />
          ))}
        </div>
      )}
    </main>
  );
}
