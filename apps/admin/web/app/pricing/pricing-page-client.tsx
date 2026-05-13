"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createUpgradeRequest,
  fetchSubscriptionPlans,
  type CreateUpgradeRequestInput,
  type SubscriptionPlan,
} from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function formatPrice(value: number, currency: string, suffix: string) {
  if (value === 0) {
    return `EUR 0 ${suffix}`;
  }

  return `${currency} ${value.toLocaleString("ro-RO")} ${suffix}`;
}

function normalizeFeatureLabel(featureKey: string) {
  return featureKey
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (value) => value.toUpperCase())
    .trim();
}

function getPlanCtaLabel(planCode: SubscriptionPlan["code"], isCurrentPlan: boolean) {
  if (isCurrentPlan) {
    return "Current plan";
  }

  switch (planCode) {
    case "BASIC":
      return "Start free";
    case "BRONZE":
      return "Request Bronze";
    case "GOLD":
      return "Request Gold";
    case "ENTERPRISE":
      return "Contact Sales";
  }
}

export function PricingPageClient() {
  const searchParams = useSearchParams();
  const { isReady, isAuthenticated, subscription, remainingPrivateContacts, token, user } =
    useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"BRONZE" | "GOLD" | "ENTERPRISE">(
    "BRONZE",
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    message: "",
  });

  const reason = searchParams.get("reason");
  const planQuery = searchParams.get("plan");
  const requestedSource =
    reason === "private-contact-limit" ? "LIMIT_REACHED" : ("PRICING" as const);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      try {
        setLoading(true);
        setError(null);
        const nextPlans = await fetchSubscriptionPlans();

        if (!cancelled) {
          setPlans(nextPlans);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load pricing plans.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestedPlan =
      planQuery === "GOLD" || planQuery === "ENTERPRISE" || planQuery === "BRONZE"
        ? planQuery
        : null;

    if (requestedPlan) {
      setSelectedPlan(requestedPlan);
    }
  }, [planQuery]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      name: user?.displayName ?? current.name,
      email: user?.email ?? current.email,
      companyName: user?.profile?.companyName ?? current.companyName,
    }));
  }, [user?.displayName, user?.email, user?.profile?.companyName]);

  const selectedPlanDetails = useMemo(
    () => plans.find((plan) => plan.code === selectedPlan) ?? null,
    [plans, selectedPlan],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const payload: CreateUpgradeRequestInput = {
        requestedPlanCode: selectedPlan,
        name: form.name.trim() || undefined,
        email: form.email.trim() || undefined,
        companyName: form.companyName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        message: form.message.trim() || undefined,
        source: requestedSource,
      };

      await createUpgradeRequest(payload, token);
      setSuccessMessage("Cererea a fost trimisa. Echipa OpenStaff te va contacta.");
      setForm((current) => ({
        ...current,
        phone: "",
        message: "",
      }));
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof ApiError || submitFailure instanceof Error
          ? submitFailure.message
          : "Nu am putut trimite cererea de upgrade.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="px-6 py-10 md:py-14">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="openstaff-surface rounded-[2.4rem] p-8 md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-navy/70">
                Pricing & Entitlements
              </div>
              <h1 className="mt-4 text-4xl font-bold text-brand-charcoal">
                Upgrade paths for private outreach and structured delivery
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                Compare plan limits and request an upgrade directly from the pricing page. OpenStaff
                will review the request and contact you manually.
              </p>
              {reason === "private-contact-limit" ? (
                <div className="mt-5 rounded-[1.4rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  Ai atins limita de contacte pentru planul curent. Cere upgrade pentru a continua.
                </div>
              ) : null}
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Your account
              </div>
              {isReady && isAuthenticated ? (
                <>
                  <div className="mt-4 text-2xl font-semibold text-brand-charcoal">
                    {subscription?.planName ?? "No active plan"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Private contacts left:
                    <span className="ml-2 font-semibold text-brand-charcoal">
                      {remainingPrivateContacts === null
                        ? "Unlimited / not tracked"
                        : remainingPrivateContacts}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Current limit:
                    <span className="ml-2 font-semibold text-brand-charcoal">
                      {subscription?.contactLimit === 0
                        ? "Unlimited"
                        : subscription?.contactLimit ?? 0}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-4 text-2xl font-semibold text-brand-charcoal">
                    Not signed in
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Public lead requests are allowed. Sign in only if you want your current plan to
                    be attached automatically.
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link
                      href="/register"
                      className="rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
                    >
                      Create account
                    </Link>
                    <Link
                      href="/login"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Login
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-[1.8rem] border border-rose-200 bg-rose-50 px-6 py-5 text-sm text-rose-800">
            {error}
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={`plan-skeleton-${index}`} className="openstaff-card rounded-[2rem] p-6">
                  <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                  <div className="mt-4 h-8 w-32 animate-pulse rounded bg-slate-100" />
                  <div className="mt-3 h-20 animate-pulse rounded-2xl bg-slate-100" />
                </div>
              ))
            : plans.map((plan) => {
                const featureEntries = Object.entries(plan.features).filter(([, enabled]) => enabled);
                const isCurrentPlan = subscription?.planCode === plan.code;
                const canRequest = plan.code !== "BASIC";

                return (
                  <article
                    key={plan.code}
                    className={`openstaff-card rounded-[2rem] p-6 ${
                      isCurrentPlan ? "ring-2 ring-brand-mint" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                        {plan.code}
                      </div>
                      {isCurrentPlan ? (
                        <span className="rounded-full bg-brand-mint px-3 py-1 text-[11px] font-semibold text-brand-charcoal">
                          Current plan
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-2xl font-bold text-brand-charcoal">{plan.name}</h2>
                    <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
                      {plan.description || "Structured OpenStaff access for delivery teams."}
                    </p>

                    <div className="mt-5 rounded-[1.4rem] bg-slate-50 p-4">
                      <div className="text-sm text-slate-500">Monthly</div>
                      <div className="mt-1 text-2xl font-semibold text-brand-charcoal">
                        {formatPrice(plan.priceMonthly, plan.currency, "/month")}
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        Yearly: {formatPrice(plan.priceYearly, plan.currency, "/year")}
                      </div>
                    </div>

                    <div className="mt-5 rounded-[1.4rem] border border-slate-200 bg-white p-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                        Private contacts
                      </div>
                      <div className="mt-2 text-lg font-semibold text-brand-charcoal">
                        {plan.contactLimit === 0 ? "Unlimited" : `${plan.contactLimit} / month`}
                      </div>
                    </div>

                    <div className="mt-5 space-y-2">
                      {featureEntries.length ? (
                        featureEntries.map(([featureKey]) => (
                          <div
                            key={`${plan.code}-${featureKey}`}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                          >
                            {normalizeFeatureLabel(featureKey)}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-[1.2rem] border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500">
                          No premium feature flags published on this plan.
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      {canRequest ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPlan(plan.code as "BRONZE" | "GOLD" | "ENTERPRISE")
                          }
                          className="inline-flex rounded-full bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
                        >
                          {getPlanCtaLabel(plan.code, isCurrentPlan)}
                        </button>
                      ) : (
                        <Link
                          href={isAuthenticated ? "/projects" : "/register"}
                          className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                        >
                          {getPlanCtaLabel(plan.code, isCurrentPlan)}
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
        </section>

        <section className="openstaff-card rounded-[2rem] p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
                Upgrade request
              </div>
              <h2 className="mt-3 text-3xl font-bold text-brand-charcoal">
                {selectedPlanDetails
                  ? `Request ${selectedPlanDetails.name}`
                  : "Request a plan review"}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Submit a manual upgrade request. This does not activate the plan automatically and
                does not create a payment.
              </p>
            </div>
            {subscription?.planCode ? (
              <div className="rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Current plan: <span className="font-semibold">{subscription.planCode}</span>
              </div>
            ) : null}
          </div>

          <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm text-slate-700">
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy"
                placeholder="Your name"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy"
                placeholder="you@company.com"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Company</span>
              <input
                value={form.companyName}
                onChange={(event) =>
                  setForm((current) => ({ ...current, companyName: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy"
                placeholder="Company name"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700">
              <span>Phone</span>
              <input
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy"
                placeholder="+40 ..."
              />
            </label>

            <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
              <span>Requested plan</span>
              <select
                value={selectedPlan}
                onChange={(event) =>
                  setSelectedPlan(event.target.value as "BRONZE" | "GOLD" | "ENTERPRISE")
                }
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy"
              >
                <option value="BRONZE">BRONZE</option>
                <option value="GOLD">GOLD</option>
                <option value="ENTERPRISE">ENTERPRISE</option>
              </select>
            </label>

            <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
              <span>Message</span>
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({ ...current, message: event.target.value }))
                }
                rows={5}
                className="w-full rounded-[1.5rem] border border-slate-200 px-4 py-3 outline-none transition focus:border-brand-navy"
                placeholder="What kind of access or outreach volume do you need?"
              />
            </label>

            {submitError ? (
              <div className="md:col-span-2 rounded-[1.4rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {submitError}
              </div>
            ) : null}

            {successMessage ? (
              <div className="md:col-span-2 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {successMessage}
              </div>
            ) : null}

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-brand-navy px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending request..." : "Send upgrade request"}
              </button>
              <div className="text-sm text-slate-500">
                Source: <span className="font-semibold">{requestedSource}</span>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
