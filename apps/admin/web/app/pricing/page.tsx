import { Suspense } from "react";
import { PricingPageClient } from "./pricing-page-client";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="px-6 py-10 md:py-14">
          <div className="mx-auto max-w-7xl">
            <section className="openstaff-surface rounded-[2.4rem] p-8 md:p-10">
              <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-12 w-2/3 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-24 animate-pulse rounded bg-slate-100" />
            </section>
          </div>
        </main>
      }
    >
      <PricingPageClient />
    </Suspense>
  );
}
