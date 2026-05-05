"use client";

import { useEffect } from "react";
import { adminEnvironmentStatus, adminRouteStatuses } from "@/lib/app-status";

export function StatusConsoleReporter() {
  useEffect(() => {
    console.groupCollapsed("[OpenStaff Admin] route status");
    console.table(
      adminRouteStatuses.map((item) => ({
        route: item.path,
        label: item.label,
        status: item.status,
        note: item.note,
      })),
    );
    console.info("[OpenStaff Admin] environment", adminEnvironmentStatus);
    console.groupEnd();
  }, []);

  return null;
}
