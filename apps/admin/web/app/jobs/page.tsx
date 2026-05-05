import { Suspense } from "react";
import JobsPageClient from "@/components/JobsPageClient";

export default function JobsPage() {
  return (
    <Suspense fallback={<main style={{ padding: 40, textAlign: "center", color: "#8892B0" }}>Se încarcă...</main>}>
      <JobsPageClient />
    </Suspense>
  );
}
