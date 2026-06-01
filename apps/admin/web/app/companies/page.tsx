import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Companies | OpenStaff",
  description:
    "Discover approved company, subcontractor, and professional marketplace profiles on OpenStaff.",
  alternates: {
    canonical: "/professionals",
  },
};

export default function CompaniesIndexPage() {
  permanentRedirect("/professionals");
}
