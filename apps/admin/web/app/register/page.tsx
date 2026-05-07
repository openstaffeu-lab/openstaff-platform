"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerAccount } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const PROFILE_TYPES = [
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "SUBCONTRACTOR", label: "Subcontractor" },
  { value: "PROFESSIONAL", label: "Professional" },
  { value: "INVESTOR", label: "Investor" },
  { value: "TRAINING_COMPANY", label: "Training Company" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "HSE_SAFETY", label: "HSE / Safety" },
  { value: "SUPPLIER", label: "Supplier" },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileType, setProfileType] = useState<(typeof PROFILE_TYPES)[number]["value"]>("CONTRACTOR");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setLoading(true);
    setError(null);

    try {
      const response = await registerAccount({
        email,
        password,
        displayName,
        companyName,
        profileType,
      });

      login(response.access_token, response.user);
      router.push("/profile");
    } catch (registrationError) {
      setError(
        registrationError instanceof Error
          ? registrationError.message
          : "We could not create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="openstaff-surface rounded-[2.2rem] p-8 md:p-10">
          <div className="text-xs font-semibold uppercase tracking-[0.4em] text-brand-navy/70">OpenStaff</div>
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">Create your account</h1>
          <p className="mt-4 text-slate-600">
            Start with a real OpenStaff account, choose your marketplace role, and continue directly into your profile workspace.
          </p>
          <div className="mt-8 rounded-[1.7rem] border border-amber-100 bg-amber-50 p-5 text-sm leading-7 text-slate-700">
            New accounts start in <strong>pending approval</strong>. You can complete your profile immediately, and the backoffice can then approve or moderate it for public visibility.
          </div>
          <div className="mt-8 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-navy">
              Login here
            </Link>
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-600">Display name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="Andrei Popescu / North Build"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-600">Company name</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="Optional"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-600">Marketplace role</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                value={profileType}
                onChange={(event) =>
                  setProfileType(event.target.value as (typeof PROFILE_TYPES)[number]["value"])
                }
              >
                {PROFILE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="contact@openstaff.eu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-600">Password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="Minimum 6 characters"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <button
            onClick={() => void handleRegister()}
            disabled={loading || !displayName.trim() || !email.trim() || password.length < 6}
            className="mt-6 w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </section>
      </div>
    </main>
  );
}
