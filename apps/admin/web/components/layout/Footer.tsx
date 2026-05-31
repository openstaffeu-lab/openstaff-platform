"use client";

import Link from "next/link";
import { Logo } from "../brand/Logo";
import { useUiConfig } from "../../context/UiConfigContext";

const businessLinks = [
  { label: "Publish now", href: "/publish", icon: "briefcase" },
  { label: "Find Talent", href: "/professionals", icon: "people" },
  { label: "Logistics Services", href: "/logistics", icon: "truck" },
  { label: "Specialized Tests", href: "/tests", icon: "shield" },
  { label: "Pricing Tiers", href: "/pricing", icon: "tag" },
  { label: "How It Works", href: "/#how-it-works", icon: "book" },
];

const supportLinks = [
  { label: "Contact Us", href: "mailto:info@openstaff.eu" },
  { label: "Help Center", href: "/status" },
  { label: "FAQ", href: "/ai" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Cookies", href: "/cookies" },
];

const coverageFlags = ["EU", "UK", "USA", "CA", "AU", "UAE", "SG", "RO"];
const socialLabels = ["in", "f", "ig", "yt", "x"];

export function Footer() {
  const { config } = useUiConfig();

  return (
    <footer className="bg-[#0F172A] text-[#F8FAFC]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1fr_1fr_1.2fr] lg:px-8">
        <section>
          <Logo
            href="/"
            logoDataUrl={config.footer.logoDataUrl || config.header.logoDataUrl}
            logoAlt={config.footer.logoAlt || config.header.logoAlt}
            theme="dark"
          />
          <p className="mt-2 text-xs font-bold text-white/75">THE STRUCTURE FOR GLOBAL WORK.</p>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#CBD5E1]">
            OpenStaff connects public opportunity discovery with compliant execution, cross-border
            workforce operations, and structured communication.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {socialLabels.map((label) => (
              <span
                key={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xs font-bold text-white"
              >
                {label}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-base font-black text-white">Business & Operations</h3>
          <div className="mt-4 grid gap-3">
            {businessLinks.map((link) => (
              <FooterItem key={link.label} link={link} showIcon />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-base font-black text-white">Support & Legal</h3>
          <div className="mt-4 grid gap-3">
            {supportLinks.map((link) => (
              <FooterItem key={link.label} link={link} />
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-base font-black text-white">Communications & Apps</h3>
          <div className="mt-4 grid gap-4 text-sm text-[#CBD5E1]">
            <div className="flex gap-3">
              <FooterIcon name="phone" />
              <div>
                <p className="font-semibold text-white">Customer Support</p>
                <p>Mon - Fri 08:00 - 18:00 EET</p>
              </div>
            </div>
            <div className="flex gap-3">
              <FooterIcon name="message" />
              <div>
                <p className="font-semibold text-white">WhatsApp placeholder</p>
                <a href="tel:+40770123456" className="hover:text-[#22C55E]">
                  +40 770 123 456
                </a>
              </div>
            </div>
            <div className="flex gap-3">
              <FooterIcon name="mail" />
              <div>
                <p className="font-semibold text-white">Email</p>
                <a href="mailto:info@openstaff.eu" className="hover:text-[#22C55E]">
                  info@openstaff.eu
                </a>
              </div>
            </div>
            <div className="grid max-w-xs grid-cols-2 gap-3 pt-2">
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-bold text-white">
                App Store
              </span>
              <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-center text-xs font-bold text-white">
                Google Play
              </span>
            </div>
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 bg-[#0B1329]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-sm font-bold text-white">Global coverage</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {coverageFlags.map((flag) => (
                <span key={flag} className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-[#E2E8F0]">
                  {flag}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-xs font-bold text-[#E2E8F0]">
            <span className="rounded-full border border-white/15 px-3 py-2">ISO 27001</span>
            <span className="rounded-full border border-white/15 px-3 py-2">GDPR Compliant</span>
            <span className="rounded-full border border-white/15 px-3 py-2">SOC 2 Type II</span>
          </div>
        </div>
        <div className="border-t border-white/10 px-4 py-4 text-center text-xs leading-6 text-[#94A3B8]">
          {config.footer.bottomText}
        </div>
      </div>
    </footer>
  );
}

function FooterItem({
  link,
  showIcon = false,
}: {
  link: {
    label: string;
    href: string;
    icon?: string;
  };
  showIcon?: boolean;
}) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(link.href);
  const content = (
    <>
      {showIcon && link.icon ? <FooterIcon name={link.icon} /> : null}
      <span>{link.label}</span>
    </>
  );

  if (isExternal) {
    return (
      <a href={link.href} className="flex items-center gap-3 text-sm text-[#CBD5E1] transition hover:text-[#22C55E]">
        {content}
      </a>
    );
  }

  return (
    <Link
      href={link.href}
      prefetch={false}
      className="flex items-center gap-3 text-sm text-[#CBD5E1] transition hover:text-[#22C55E]"
    >
      {content}
    </Link>
  );
}

function FooterIcon({ name }: { name: string }) {
  const common = {
    className: "h-5 w-5 shrink-0 text-[#60A5FA]",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
  };

  switch (name) {
    case "briefcase":
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );
    case "truck":
      return (
        <svg {...common}>
          <path d="M10 17h4V5H2v12h3" />
          <path d="M14 8h4l4 4v5h-3" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
        </svg>
      );
    case "tag":
      return (
        <svg {...common}>
          <path d="M20.6 13.5 13.5 20.6a2 2 0 0 1-2.8 0L3 12.9V3h9.9l7.7 7.7a2 2 0 0 1 0 2.8Z" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7A2 2 0 0 1 22 16.9Z" />
        </svg>
      );
    case "message":
      return (
        <svg {...common}>
          <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 1 1 17 0Z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
  }
}

export default Footer;
