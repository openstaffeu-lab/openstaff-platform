type StatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
};

export default function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <div className="rounded-3xl bg-slate-900 p-6">
      <div className="text-sm text-slate-400">{title}</div>
      <div className="mt-3 text-4xl font-bold">{value}</div>
      {subtitle ? <div className="mt-3 text-sm text-slate-300">{subtitle}</div> : null}
    </div>
  );
}