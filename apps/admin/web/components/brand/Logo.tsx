import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  href?: string;
  className?: string;
  compact?: boolean;
  logoDataUrl?: string;
  logoAlt?: string;
  theme?: "light" | "dark";
};

export function Logo({
  href = "/",
  className = "",
  compact = false,
  logoDataUrl = "",
  logoAlt = "OpenStaff logo",
  theme = "light",
}: LogoProps) {
  const titleClass = theme === "dark" ? "text-white" : "text-[#1A237E]";
  const subtitleClass =
    theme === "dark" ? "text-white/70" : "text-[#1A237E]/70";

  return (
    <Link href={href} className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`flex items-center gap-3 ${
          compact ? "rounded-2xl" : "rounded-3xl"
        }`}
      >
        {logoDataUrl ? (
          <Image
            src={logoDataUrl}
            alt={logoAlt}
            width={compact ? 84 : 112}
            height={compact ? 48 : 64}
            unoptimized
            className={`h-auto w-auto object-contain ${
              compact ? "max-h-10 max-w-[84px]" : "max-h-14 max-w-[112px]"
            }`}
          />
        ) : (
          <DefaultOpenStaffMark compact={compact} theme={theme} />
        )}

        {!compact ? (
          <div className="min-w-0">
            <div className={`text-xl font-black tracking-[-0.03em] ${titleClass}`}>
              OpenStaff
            </div>
            <div className={`text-[11px] uppercase tracking-[0.28em] ${subtitleClass}`}>
              The Structure for Global Work.
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function DefaultOpenStaffMark({
  compact,
  theme,
}: {
  compact: boolean;
  theme: "light" | "dark";
}) {
  const wordmarkColor = theme === "dark" ? "#F5F7FA" : "#263238";

  return (
    <svg
      viewBox="0 0 160 68"
      aria-hidden="true"
      className={compact ? "h-10 w-auto" : "h-12 w-auto"}
    >
      <defs>
        <linearGradient id="openstaff-arc" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#1A237E" />
          <stop offset="100%" stopColor="#00E676" />
        </linearGradient>
      </defs>
      <path
        d="M18 48C18 29.2 31.9 15 50.4 15C66.7 15 77.6 25.4 81.7 38.5C86.8 31 95.8 25 108.8 25C124.9 25 138 36.5 143 51"
        fill="none"
        stroke="url(#openstaff-arc)"
        strokeLinecap="round"
        strokeWidth="7"
      />
      <path
        d="M18 48C18 29.2 31.9 15 50.4 15C68.9 15 82.7 29.2 82.7 48"
        fill="none"
        stroke="#1A237E"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="M34 57H66"
        fill="none"
        stroke="#F5F7FA"
        strokeLinecap="round"
        strokeWidth="10"
      />
      <path
        d="M34 57H42"
        fill="none"
        stroke="#1A237E"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="M58 57H66"
        fill="none"
        stroke="#1A237E"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <text
        x="75"
        y="54"
        fill={wordmarkColor}
        fontFamily="var(--font-montserrat), sans-serif"
        fontSize="29"
        fontWeight="700"
      >
        penStaff
      </text>
    </svg>
  );
}
