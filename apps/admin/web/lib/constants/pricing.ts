export const OPENSTAFF_PRICING_TIERS = [
  "FREE",
  "PRO",
  "BUSINESS",
  "ENTERPRISE",
] as const;

export type PricingTier = (typeof OPENSTAFF_PRICING_TIERS)[number];

export const OPENSTAFF_COMMISSION_TRIGGERS = [
  "CONTRACT_CLOSED",
  "PAYMENT_RELEASED",
  "LOGISTICS_SERVICE",
  "CONSULTING",
  "PREMIUM_MATCH",
] as const;

export type CommissionTrigger =
  (typeof OPENSTAFF_COMMISSION_TRIGGERS)[number];

export const OPENSTAFF_PRICING_DESCRIPTIONS: Record<
  PricingTier,
  {
    label: string;
    summary: string;
  }
> = {
  FREE: {
    label: "Zero Fee Entry",
    summary: "Free registration, free profiles, and free project posting.",
  },
  PRO: {
    label: "OpenStaff Pro",
    summary: "For growing contractors who want stronger coordination and AI support.",
  },
  BUSINESS: {
    label: "Business",
    summary: "For structured contractor networks with repeat delivery and compliance control.",
  },
  ENTERPRISE: {
    label: "Enterprise",
    summary: "For multi-country delivery with custom workflows, consulting, and logistics support.",
  },
};
