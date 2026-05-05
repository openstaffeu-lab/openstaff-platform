import {
  OPENSTAFF_PRICING_DESCRIPTIONS,
  OPENSTAFF_PRICING_TIERS,
} from "../../lib/constants/pricing";

export const pricingServiceConfig = {
  tiers: OPENSTAFF_PRICING_TIERS,
  descriptions: OPENSTAFF_PRICING_DESCRIPTIONS,
  notes:
    "UI-only pricing structure for OpenStaff monetization without introducing billing logic.",
} as const;
