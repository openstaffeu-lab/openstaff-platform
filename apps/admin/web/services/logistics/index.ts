export const logisticsServiceConfig = {
  readiness: "prepared",
  triggers: ["CONTRACT_CLOSED", "PAYMENT_RELEASED"],
  notes:
    "Placeholder frontend service boundary for future OpenStaff logistics orchestration.",
} as const;
