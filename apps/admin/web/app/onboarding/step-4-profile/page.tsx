"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import DocumentUploadCard from "@/components/DocumentUploadCard";
import { useAuth } from "@/context/AuthContext";
import { useOnboardingState } from "@/lib/onboarding";

export default function OnboardingStep4Page() {
  const router = useRouter();
  const { token } = useAuth();
  const { ready, state, setPartial } = useOnboardingState();
  const [displayName, setDisplayName] = useState(state.displayName);
  const [email, setEmail] = useState(state.email);
  const [phone, setPhone] = useState(state.phone);
  const [bio, setBio] = useState(state.bio);
  const [experienceYears, setExperienceYears] = useState(state.experienceYears);
  const [companyName, setCompanyName] = useState(state.companyName);
  const [companyAdministrator, setCompanyAdministrator] = useState(state.companyAdministrator);
  const [companyCui, setCompanyCui] = useState(state.companyCui || state.vatNumber);

  if (!ready) {
    return null;
  }

  const isCompany = state.actorType !== "INDIVIDUAL";

  return (
    <section style={{ background: "white", borderRadius: 18, padding: 24, border: "1px solid #E8EBF5" }}>
      <div style={{ display: "grid", gap: 16 }}>
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={isCompany ? "Numele reprezentantului / brandului" : "Nume afișat"}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
        />
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email contact"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
        />
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="Telefon"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
        />
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="Descriere scurtă a experienței"
          rows={5}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
        />
        <input
          value={experienceYears}
          onChange={(event) => setExperienceYears(event.target.value)}
          placeholder="Ani experiență"
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
        />

        {isCompany ? (
          <>
            <input
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Nume companie / instituție"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
            />
            <input
              value={companyAdministrator}
              onChange={(event) => setCompanyAdministrator(event.target.value)}
              placeholder="Administrator / reprezentant"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
            />
            <input
              value={companyCui}
              onChange={(event) => setCompanyCui(event.target.value)}
              placeholder="CUI"
              style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #E8EBF5" }}
            />
          </>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          <DocumentUploadCard
            label="Document CI"
            documentType="CI"
            token={token}
            fileUrl={state.ciFileUrl}
            onUploaded={(ciFileUrl) => setPartial({ ciFileUrl })}
          />
          <DocumentUploadCard
            label="Cazier"
            documentType="CAZIER"
            token={token}
            fileUrl={state.cazierUrl}
            onUploaded={(cazierUrl) => setPartial({ cazierUrl })}
          />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <button
          onClick={() => router.push("/onboarding/step-3-classification")}
          style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid #E8EBF5", background: "white" }}
        >
          Înapoi
        </button>
        <button
          onClick={() => {
            setPartial({
              displayName,
              email,
              phone,
              bio,
              experienceYears,
              companyName,
              companyAdministrator,
              companyCui,
            });
            router.push("/onboarding/step-5-confirm");
          }}
          style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#1B2A6B", color: "white" }}
        >
          Continuă
        </button>
      </div>
    </section>
  );
}
