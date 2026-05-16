import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://openstaff.eu/sitemap.xml",
    host: "https://openstaff.eu",
  };
}
