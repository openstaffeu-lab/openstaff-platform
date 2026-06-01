"use client";

import type { ReluBuilderStatus } from "@/lib/relu-builder-api";

const statusCopy: Record<
  ReluBuilderStatus,
  { label: string; className: string }
> = {
  idle: {
    label: "Ready",
    className: "border-[#DBEAFE] bg-white text-[#1E3A8A]",
  },
  processing: {
    label: "RELU AI is processing",
    className: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]",
  },
  completed: {
    label: "AI suggestions ready",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  review_required: {
    label: "Human review needed",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  failed: {
    label: "AI unavailable",
    className: "border-rose-200 bg-rose-50 text-rose-800",
  },
  unavailable: {
    label: "Provider temporarily unavailable",
    className: "border-orange-200 bg-orange-50 text-orange-800",
  },
};

export default function ReluStatusBadge({ status }: { status: ReluBuilderStatus }) {
  const copy = statusCopy[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${copy.className}`}
    >
      {copy.label}
    </span>
  );
}
