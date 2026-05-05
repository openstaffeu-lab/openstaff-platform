"use client";

import { useEffect } from "react";
import { publicEnvironmentStatus, publicRouteStatuses } from "../lib/app-status";

export function StatusConsoleReporter() {
  useEffect(() => {
    console.groupCollapsed("[OpenStaff Public] route status");
    console.table(
      publicRouteStatuses.map((item) => ({
        route: item.path,
        label: item.label,
        status: item.status,
        note: item.note,
      })),
    );
    console.info("[OpenStaff Public] environment", publicEnvironmentStatus);
    console.groupEnd();
  }, []);

  return null;
}
