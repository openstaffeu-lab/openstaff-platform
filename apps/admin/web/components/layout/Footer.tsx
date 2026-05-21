"use client";

import Link from "next/link";
import { Logo } from "../brand/Logo";
import { useUiConfig } from "../../context/UiConfigContext";

export function Footer() {
  const { config } = useUiConfig();

  return (
    <footer className="border-t-4 border-[#00E676] bg-[#1A237E] text-[#F5F7FA]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.1fr_repeat(3,minmax(0,1fr))]">
        <section>
          <Logo
            href="/"
            logoDataUrl={config.footer.logoDataUrl || config.header.logoDataUrl}
            logoAlt={config.footer.logoAlt || config.header.logoAlt}
            theme="dark"
          />
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
            OpenStaff connects public opportunity discovery with compliant execution,
            cross-border workforce operations, and structured communication.
          </p>
        </section>

        {config.footer.columns.map((column) => (
          <section key={column.title}>
            <h3 className="mb-3 text-base font-black text-white">{column.title}</h3>
            <div className="space-y-2">
              {column.links.map((link) => (
                <FooterItem key={`${column.title}-${link.label}-${link.href}`} link={link} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="border-t border-white/20 px-4 py-4 text-center text-xs leading-6 text-white/80">
        {config.footer.bottomText}
      </div>
    </footer>
  );
}

function FooterItem({
  link,
}: {
  link: {
    label: string;
    href: string;
  };
}) {
  const isExternal = /^(https?:|mailto:|tel:)/.test(link.href);

  if (isExternal) {
    return (
      <p>
        <a href={link.href} className="text-sm text-[#F5F7FA] transition hover:text-[#00E676]">
          {link.label}
        </a>
      </p>
    );
  }

  return (
    <p>
      <Link
        href={link.href}
        prefetch={false}
        className="text-sm text-[#F5F7FA] transition hover:text-[#00E676]"
      >
        {link.label}
      </Link>
    </p>
  );
}

export default Footer;
