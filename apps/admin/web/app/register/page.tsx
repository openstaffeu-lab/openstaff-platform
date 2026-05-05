"use client";

import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();
  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function registerWithEmail() {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase Auth nu este configurat pentru această aplicație.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/onboarding/step-1-type");
    } catch (registrationError) {
      setError(
        registrationError instanceof Error ? registrationError.message : "Nu am putut crea contul.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function registerWithGoogle() {
    const auth = getFirebaseAuth();
    if (!auth) {
      setError("Firebase Auth nu este configurat pentru această aplicație.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push("/onboarding/step-1-type");
    } catch (registrationError) {
      setError(
        registrationError instanceof Error ? registrationError.message : "Autentificarea cu Google a eșuat.",
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
          <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">Creează cont</h1>
          <p className="mt-4 text-slate-600">
            Începe onboarding-ul pentru contractor, companie sau instituție și continuă direct în fluxul ghidat.
          </p>
          <div className="mt-8 rounded-[1.7rem] border border-emerald-100 bg-emerald-50 p-5 text-sm leading-7 text-slate-600">
            Contul se creează cu Firebase Auth, iar profilul operațional se completează în pașii următori.
          </div>
          <div className="mt-8 text-sm text-slate-500">
            Ai deja cont?{" "}
            <Link href="/login" className="font-semibold text-brand-navy">
              Login aici
            </Link>
          </div>
        </section>

        <section className="openstaff-card rounded-[2.2rem] p-8 md:p-10">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Email</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="contact@openstaff.eu"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">Parolă</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 outline-none"
                placeholder="Minimum 6 caractere"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {!firebaseReady ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Firebase nu este configurat local. Build-ul rămâne valid, dar înregistrarea reală are nevoie de
                variabilele `NEXT_PUBLIC_FIREBASE_*`.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              onClick={() => void registerWithEmail()}
              disabled={loading || !email.trim() || password.length < 6}
              className="w-full rounded-2xl bg-brand-navy px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Se creează contul..." : "Creează cont cu email"}
            </button>

            <button
              onClick={() => void registerWithGoogle()}
              disabled={loading}
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-brand-navy disabled:cursor-not-allowed disabled:opacity-70"
            >
              Continuă cu Google
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
