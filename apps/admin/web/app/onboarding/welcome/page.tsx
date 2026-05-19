"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOnboardingMe, updateOnboardingStep } from "@/lib/api";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { ready, setPartial } = useOnboardingState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !token) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const snapshot = await getOnboardingMe(token);
        if (!cancelled) {
          setPartial({
            displayName: snapshot.identityProfile.displayName ?? "",
            firstName: snapshot.identityProfile.firstName ?? "",
            lastName: snapshot.identityProfile.lastName ?? "",
            email: user?.email ?? "",
            phone: snapshot.identityProfile.phone ?? "",
            countryCode: snapshot.identityProfile.country ?? "RO",
            languageCode: snapshot.identityProfile.language ?? "ro",
            timezone: snapshot.identityProfile.timezone ?? "Europe/Bucharest",
            companyName: snapshot.companyProfile?.companyName ?? "",
            companyCui: snapshot.companyProfile?.vatId ?? "",
            website: snapshot.identityProfile.website ?? snapshot.companyProfile?.website ?? "",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [ready, setPartial, token, user?.email]);

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 18 }}>
        <div>
          <div style={{ color: "#00C060", fontWeight: 700, fontSize: 13 }}>Onboarding</div>
          <h2 style={{ color: "#1B2A6B", fontSize: 28, fontWeight: 800, margin: "6px 0 0" }}>
            Completeaza profilul tau OpenStaff
          </h2>
        </div>

        <p style={{ color: "#334155", lineHeight: 1.7 }}>
          Acest flow te ajuta sa completezi datele publice de baza pentru profilul tau si, daca
          este cazul, datele companiei. Datele private de autentificare si billing nu sunt afisate
          public.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          {[
            "Profil public cu slug sigur",
            "Date separate pentru persoana si companie",
            "Pasi clari pana la finalizarea profilului",
            "Datele de autentificare si billing raman private",
          ].map((item) => (
            <div
              key={item}
              style={{
                border: "1px solid #E8EBF5",
                borderRadius: 16,
                padding: 16,
                color: "#1E293B",
                background: "#F8FAFC",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" style={{ color: "#1B2A6B", fontWeight: 700, textDecoration: "none" }}>
            Mai tarziu
          </Link>
          <button
            onClick={async () => {
              if (!token) {
                router.push("/login");
                return;
              }

              await updateOnboardingStep(
                {
                  currentStep: "identity",
                  completedStep: "welcome",
                },
                token,
              );
              setPartial({ currentStep: "identity" });
              router.push("/onboarding/identity");
            }}
            disabled={loading}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#1B2A6B", color: "white" }}
          >
            {loading ? "Se pregateste..." : "Incepe onboarding"}
          </button>
        </div>
      </div>
    </section>
  );
}
