"use client";

import type { ReluBuilderStatus } from "@/lib/relu-builder-api";

const statusCopy: Record<
  ReluBuilderStatus,
  { label: string; className: string }
> = {
  idle: {
    label: "Ready",
    className: "border-slate-200 bg-white text-slate-700",
  },
  processing: {
    label: "RELU AI is processing",
    className: "border-sky-200 bg-sky-50 text-sky-800",
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
