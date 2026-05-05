"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getActor } from "@/lib/api";

export default function ProfessionalDetailPage() {
  const params = useParams<{ id: string }>();
  const [actor, setActor] = useState<any>(null);

  useEffect(() => {
    if (params?.id) {
      getActor(params.id).then(setActor);
    }
  }, [params?.id]);

  if (!actor) {
    return <main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>Se încarcă profilul...</main>;
  }

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 24px 64px" }}>
      <Link href="/professionals" style={{ color: "#00C060", fontWeight: 700, textDecoration: "none" }}>
        ← Înapoi la profesioniști
      </Link>
      <section style={{ marginTop: 16, background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
        <h1 style={{ color: "#1B2A6B", fontSize: 32, fontWeight: 800, margin: "0 0 10px" }}>{actor.displayName}</h1>
        <div style={{ color: "#8892B0" }}>
          {actor.actorType} · {actor.regionCode || "RO"} · {actor.isVerified ? "Verificat" : "În verificare"}
        </div>
        <p style={{ marginTop: 20, color: "#334155", lineHeight: 1.8 }}>{actor.bio || "Profilul nu are încă bio public."}</p>
      </section>
    </main>
  );
}
