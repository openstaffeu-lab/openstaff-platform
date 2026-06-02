import type { MetadataRoute } from "next";

const PUBLIC_ROUTES = [
  "",
  "/jobs",
  "/professionals",
  "/companies",
  "/projects",
  "/pricing",
  "/publish",
  "/onboarding",
  "/pools",
  "/compliance",
  "/logistics",
  "/ai",
  "/tests",
  "/terms",
  "/privacy",
  "/cookies",
  "/anpc",
  "/status",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((path) => ({
    url: `https://openstaff.eu${path}`,
    lastModified,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
