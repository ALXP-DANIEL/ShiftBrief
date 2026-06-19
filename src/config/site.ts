import { env } from "@/env";
import type { SiteConfig } from "@/types/site";

export const siteConfig: SiteConfig = {
  name: "ShiftBrief",
  author: "ALXP-DANIEL",
  description:
    "Multiple worker voice updates. One clean team handover. ShiftBrief merges scattered shift updates into a single action-ready brief with tasks, risks, and a follow-up message.",
  keywords: [
    "ShiftBrief",
    "shift handover",
    "team operations",
    "small business",
    "voice updates",
    "AI handover",
  ],
  url: {
    base: env.NEXT_PUBLIC_SITE_URL,
    author: "https://alifdaniel.dpdns.org",
  },
  links: {
    github: "https://github.com/ALXP-DANIEL",
    instagram: "https://www.instagram.com/thealifhaker1/",
    linkedin: "https://www.linkedin.com/in/thealifhaker1",
    email: "alifdaniel.workspace@gmail.com",
  },
  ogImage: `${env.NEXT_PUBLIC_SITE_URL}/api/og`,
};
