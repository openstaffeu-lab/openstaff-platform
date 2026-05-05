import { OPENSTAFF_COMMISSION_TRIGGERS } from "../../lib/constants/pricing";

export const commissionServiceConfig = {
  triggers: OPENSTAFF_COMMISSION_TRIGGERS,
  notes:
    "Frontend commission-trigger structure aligned with future OpenStaff monetization surfaces.",
} as const;
