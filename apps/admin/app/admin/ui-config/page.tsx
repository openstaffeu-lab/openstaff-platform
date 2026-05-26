"use client";

import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";
import { TechnicalModeGate } from "@/components/TechnicalModeGate";
import { fetchApiJson } from "@/lib/api";

type UiLink = {
  label: string;
  href: string;
};

type UiFooterColumn = {
  title: string;
  links: UiLink[];
};

type UiConfig = {
  header: {
    logoDataUrl: string;
    logoAlt: string;
    menu: UiLink[];
  };
  footer: {
    logoDataUrl: string;
    logoAlt: string;
    columns: UiFooterColumn[];
    bottomText: string;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
};

const defaultConfig: UiConfig = {
  header: {
    logoDataUrl: "",
    logoAlt: "OpenStaff logo",
    menu: [
      { label: "Active Projects", href: "/projects" },
      { label: "Professionals", href: "/professionals" },
      { label: "Subcontracting Pools", href: "/pools" },
      { label: "Compliance", href: "/compliance" },
      { label: "Logistics", href: "/logistics" },
      { label: "Relu AI", href: "/ai" },
    ],
  },
  footer: {
    logoDataUrl: "",
    logoAlt: "OpenStaff footer logo",
    columns: [
      {
        title: "Business & Operations",
        links: [
          { label: "Post a Job", href: "/projects" },
          { label: "Find Talent", href: "/professionals" },
          { label: "Logistics Services", href: "/logistics" },
          { label: "Specialized Tests", href: "/tests" },
          { label: "Pricing Tiers", href: "/pricing" },
        ],
      },
      {
        title: "Support & Contact",
        links: [
          { label: "General: info@openstaff.eu", href: "mailto:info@openstaff.eu" },
          { label: "Commercial: contact@openstaff.eu", href: "mailto:contact@openstaff.eu" },
          { label: "Contracts: office@openstaff.eu", href: "mailto:office@openstaff.eu" },
          { label: "GDPR: gdpr@openstaff.eu", href: "mailto:gdpr@openstaff.eu" },
        ],
      },
      {
        title: "Compliance & Legal",
        links: [
          { label: "Terms and Conditions", href: "/terms" },
          { label: "Privacy Policy", href: "/privacy" },
          { label: "Cookie Policy", href: "/cookies" },
          { label: "ANPC", href: "/anpc" },
        ],
      },
    ],
    bottomText:
      "ACA STRATEGIC SOLUTIONS S.R.L. | CUI: 52313191 | Reg. Com: J2025060195004 | Address: Calea Moinesti 24, Bacau, Romania | Copyright 2026 OpenStaff.eu. All rights reserved.",
  },
  branding: {
    primaryColor: "#1A237E",
    accentColor: "#00E676",
    backgroundColor: "#F5F7FA",
    textColor: "#263238",
  },
};

type Status = "loading" | "ready" | "saving" | "error";

export default function UiConfigAdminPage() {
  return (
    <TechnicalModeGate>
      <UiConfigAdminWorkspace />
    </TechnicalModeGate>
  );
}

function UiConfigAdminWorkspace() {
  const [config, setConfig] = useState<UiConfig>(defaultConfig);
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadConfig() {
      setStatus("loading");
      setMessage("");

      const result = await fetchApiJson<UiConfig>("/admin/ui-config");

      if (!mounted) {
        return;
      }

      if (!result.ok) {
        setConfig(defaultConfig);
        setStatus("error");
        setMessage(result.message);
        return;
      }

      setConfig(mergeConfig(defaultConfig, result.data));
      setStatus("ready");
    }

    void loadConfig();

    return () => {
      mounted = false;
    };
  }, []);

  async function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function handleLogoUpload(target: "header" | "footer", file?: File) {
    if (!file) {
      return;
    }

    const dataUrl = await fileToDataUrl(file);
    setConfig((current) => ({
      ...current,
      [target]: {
        ...current[target],
        logoDataUrl: dataUrl,
      },
    }));
  }

  function handleLogoRemove(target: "header" | "footer") {
    setConfig((current) => ({
      ...current,
      [target]: {
        ...current[target],
        logoDataUrl: "",
      },
    }));
  }

  function handleAltChange(target: "header" | "footer", value: string) {
    setConfig((current) => ({
      ...current,
      [target]: {
        ...current[target],
        logoAlt: value,
      },
    }));
  }

  async function saveConfig() {
    setStatus("saving");
    setMessage("");

    const result = await fetchApiJson<UiConfig>("/admin/ui-config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(config),
    });

    if (!result.ok) {
      setStatus("error");
      setMessage(result.message);
      return;
    }

    setConfig(mergeConfig(defaultConfig, result.data));
    setStatus("ready");
    setMessage("Design config saved successfully.");
  }

  return (
    <main className="p-6 text-white md:p-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
          OpenStaff Design Administration
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Header and Footer Logo Management
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Manage the public OpenStaff logo surfaces without changing homepage feed logic.
          If no uploaded logo exists, the public site falls back to the OpenStaff SVG mark.
        </p>

        {status === "loading" ? (
          <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
            Loading UI config...
          </p>
        ) : null}

        {message ? (
          <div
            className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
              status === "error"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-100"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <LogoUploadCard
            title="Header logo"
            description="Displayed in the public top navigation. If empty, the OpenStaff SVG wordmark is used."
            logoDataUrl={config.header.logoDataUrl}
            logoAlt={config.header.logoAlt}
            onAltChange={(value) => handleAltChange("header", value)}
            onUpload={(file) => void handleLogoUpload("header", file)}
            onRemove={() => handleLogoRemove("header")}
          />

          <LogoUploadCard
            title="Footer logo"
            description="Displayed in the public footer corporate area. If empty, the default OpenStaff mark is used."
            logoDataUrl={config.footer.logoDataUrl}
            logoAlt={config.footer.logoAlt}
            onAltChange={(value) => handleAltChange("footer", value)}
            onUpload={(file) => void handleLogoUpload("footer", file)}
            onRemove={() => handleLogoRemove("footer")}
          />
        </div>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
          <h2 className="text-lg font-semibold text-white">Current public config snapshot</h2>
          <p className="mt-2 text-sm text-slate-400">
            Menu, footer columns, and branding colors remain preserved when saving logos.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">
            {JSON.stringify(config, null, 2)}
          </pre>
        </section>

        <div className="mt-8">
          <button
            type="button"
            onClick={() => void saveConfig()}
            disabled={status === "saving"}
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "Saving..." : "Save logos"}
          </button>
        </div>
      </section>
    </main>
  );
}

function LogoUploadCard({
  title,
  description,
  logoDataUrl,
  logoAlt,
  onAltChange,
  onUpload,
  onRemove,
}: {
  title: string;
  description: string;
  logoDataUrl: string;
  logoAlt: string;
  onAltChange: (value: string) => void;
  onUpload: (file?: File) => void;
  onRemove: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>

      <div className="mt-5 grid min-h-[220px] place-items-center rounded-3xl border border-dashed border-slate-700 bg-slate-900 p-6">
        {logoDataUrl ? (
          <Image
            src={logoDataUrl}
            alt={logoAlt || "OpenStaff uploaded logo"}
            width={320}
            height={160}
            unoptimized
            className="h-auto max-h-36 w-auto max-w-full object-contain"
          />
        ) : (
          <DefaultLogoPreview />
        )}
      </div>

      <label className="mt-5 block text-sm font-semibold text-slate-300">
        Logo alt text
        <input
          type="text"
          value={logoAlt}
          onChange={(event) => onAltChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
        />
      </label>

      <div className="mt-5 flex flex-wrap gap-3">
        <label className="cursor-pointer rounded-full bg-white px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-slate-100">
          Upload logo
          <input
            type="file"
            accept="image/svg+xml,image/png,image/jpeg,image/webp"
            hidden
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onUpload(event.target.files?.[0])
            }
          />
        </label>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-white transition hover:border-slate-500"
        >
          Remove logo
        </button>
      </div>

      <p className="mt-4 text-xs leading-6 text-slate-500">
        Accepted formats: SVG, PNG, JPG, WEBP. Transparent SVG or PNG is recommended.
      </p>
    </section>
  );
}

function DefaultLogoPreview() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <svg
        width="140"
        height="82"
        viewBox="0 0 240 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="previewLinkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E676" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r="55" stroke="#1A237E" strokeWidth="22" fill="none" />
        <circle cx="170" cy="70" r="55" stroke="#1A237E" strokeWidth="22" fill="none" />
        <path
          d="M70 125 C 100 125, 140 15, 170 15"
          stroke="url(#previewLinkGradient)"
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M145 55 L 165 35"
          stroke="#1A237E"
          strokeWidth="22"
          strokeLinecap="round"
        />
      </svg>
      <div>
        <div className="text-lg font-black text-cyan-300">OpenStaff</div>
        <p className="text-sm text-slate-400">Default public logo preview</p>
      </div>
    </div>
  );
}

function mergeConfig(base: UiConfig, incoming: Partial<UiConfig>): UiConfig {
  return {
    header: {
      ...base.header,
      ...(incoming.header ?? {}),
      menu: Array.isArray(incoming.header?.menu) ? incoming.header.menu : base.header.menu,
    },
    footer: {
      ...base.footer,
      ...(incoming.footer ?? {}),
      columns: Array.isArray(incoming.footer?.columns)
        ? incoming.footer.columns
        : base.footer.columns,
    },
    branding: {
      ...base.branding,
      ...(incoming.branding ?? {}),
    },
  };
}
