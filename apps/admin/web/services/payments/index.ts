export const paymentsServiceConfig = {
  contractPaymentsEndpoint: "/projects/:projectId/contracts/:contractId/payments",
  requestPaymentEndpoint:
    "/projects/:projectId/contracts/:contractId/payments/request",
  notes:
    "Prepared for OpenStaff payment UI orchestration without changing ASS JOBS payment endpoints.",
} as const;
