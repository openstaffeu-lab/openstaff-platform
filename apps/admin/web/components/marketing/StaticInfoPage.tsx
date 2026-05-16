import Link from "next/link";

type StaticInfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: {
    href: string;
    label: string;
  };
  secondaryCta?: {
    href: string;
    label: string;
  };
  highlights: Array<{
    title: string;
    description: string;
  }>;
};

export function StaticInfoPage({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  highlights,
}: StaticInfoPageProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-[linear-gradient(135deg,#10215c_0%,#1f3b8f_100%)] px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-300">
            {eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-white/80 md:text-lg">
            {description}
          </p>
          {primaryCta || secondaryCta ? (
            <div className="mt-8 flex flex-wrap gap-3">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
                >
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link
                  href={secondaryCta.href}
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  {secondaryCta.label}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-black text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
