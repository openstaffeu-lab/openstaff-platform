type StatusBadgeProps = {
  label: string;
};

function getStatusClasses(label: string) {
  const value = label.toLowerCase();

  if (
    value.includes("live") ||
    value.includes("active") ||
    value.includes("completed") ||
    value.includes("enabled") ||
    value.includes("valid") ||
    value.includes("approved")
  ) {
    return "bg-emerald-500/15 text-emerald-300 border-emerald-500/20";
  }

  if (
    value.includes("pending") ||
    value.includes("review") ||
    value.includes("draft")
  ) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/20";
  }

  if (
    value.includes("delay") ||
    value.includes("delayed") ||
    value.includes("error") ||
    value.includes("inactive")
  ) {
    return "bg-rose-500/15 text-rose-300 border-rose-500/20";
  }

  return "bg-slate-700/40 text-slate-200 border-slate-700";
}

export default function StatusBadge({ label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
        label
      )}`}
    >
      {label}
    </span>
  );
}