type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export default function SectionHeader({
  eyebrow,
  title,
  description,
}: SectionHeaderProps) {
  return (
    <section className="mb-8">
      <div className="text-sm uppercase tracking-[0.2em] text-cyan-400">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-semibold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
      ) : null}
    </section>
  );
}