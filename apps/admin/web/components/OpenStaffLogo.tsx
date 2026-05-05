import { brand } from "../lib/brand";

type OpenStaffLogoProps = {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
  showTagline?: boolean;
  dark?: boolean;
};

const SIZE_MAP = {
  sm: { width: 144, height: 40 },
  md: { width: 184, height: 52 },
  lg: { width: 228, height: 64 },
} as const;

export function OpenStaffLogo({
  size = "md",
  variant = "full",
  showTagline = false,
  dark = false,
}: OpenStaffLogoProps) {
  const dimensions = SIZE_MAP[size];
  const textColor = dark ? "#FFFFFF" : brand.navy;
  const mutedColor = dark ? "rgba(255,255,255,0.72)" : brand.textMuted;

  return (
    <div className="inline-flex items-center gap-3">
      <svg
        width={variant === "icon" ? 42 : dimensions.width}
        height={variant === "icon" ? 42 : dimensions.height}
        viewBox={variant === "icon" ? "0 0 64 64" : "0 0 232 64"}
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 34C12 21.85 21.85 12 34 12C45.52 12 54.93 20.86 55.86 32.14"
          stroke={brand.navy}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M17 49H51"
          stroke="#F0F2F8"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M18 49H25"
          stroke={brand.navy}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M43 49H50"
          stroke={brand.navy}
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M21 18L48 46"
          stroke={brand.green}
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M53 20C60 24 64 31 64 39C64 50.6 54.6 60 43 60C35 60 28.3 55.7 24.8 49.3"
          stroke={brand.green}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {variant === "full" ? (
          <>
            <text
              x="78"
              y="36"
              fill={textColor}
              fontFamily="var(--font-montserrat), sans-serif"
              fontSize="24"
              fontWeight="800"
            >
              Open
            </text>
            <text
              x="138"
              y="36"
              fill={brand.green}
              fontFamily="var(--font-montserrat), sans-serif"
              fontSize="24"
              fontWeight="800"
            >
              Staff
            </text>
          </>
        ) : null}
      </svg>
      {variant === "full" && showTagline ? (
        <span
          className="hidden text-[10px] font-bold uppercase tracking-[0.24em] md:block"
          style={{ color: mutedColor }}
        >
          The Structure for Global Work.
        </span>
      ) : null}
    </div>
  );
}
