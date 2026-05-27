export type UiLink = {
  label: string;
  href: string;
};

export type UiFooterColumn = {
  title: string;
  links: UiLink[];
};

export type PublicUiConfig = {
  header: {
    logoDataUrl: string;
    logoAlt: string;
    menu: UiLink[];
  };
  footer: {
    logoDataUrl: string;
    logoAlt: string;
    columns: UiFooterColumn[];
    bottomText: string;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
};

export const PUBLIC_UI_CONFIG_KEY = 'public_site';

export const DEFAULT_PUBLIC_UI_CONFIG: PublicUiConfig = {
  header: {
    logoDataUrl: '',
    logoAlt: 'OpenStaff logo',
    menu: [
      { label: 'Active Projects', href: '/projects' },
      { label: 'Professionals', href: '/professionals' },
      { label: 'Subcontracting Pools', href: '/pools' },
      { label: 'Compliance', href: '/compliance' },
      { label: 'Logistics', href: '/logistics' },
      { label: 'Relu AI', href: '/ai' },
    ],
  },
  footer: {
    logoDataUrl: '',
    logoAlt: 'OpenStaff footer logo',
    columns: [
      {
        title: 'Business & Operations',
        links: [
          { label: 'Post a Job', href: '/projects' },
          { label: 'Find Talent', href: '/professionals' },
          { label: 'Logistics Services', href: '/logistics' },
          { label: 'Specialized Tests', href: '/tests' },
          { label: 'Pricing Tiers', href: '/pricing' },
        ],
      },
      {
        title: 'Support & Contact',
        links: [
          {
            label: 'General: info@openstaff.eu',
            href: 'mailto:info@openstaff.eu',
          },
          {
            label: 'Commercial: contact@openstaff.eu',
            href: 'mailto:contact@openstaff.eu',
          },
          {
            label: 'Contracts: office@openstaff.eu',
            href: 'mailto:office@openstaff.eu',
          },
          {
            label: 'GDPR: gdpr@openstaff.eu',
            href: 'mailto:gdpr@openstaff.eu',
          },
        ],
      },
      {
        title: 'Compliance & Legal',
        links: [
          { label: 'Terms and Conditions', href: '/terms' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Cookie Policy', href: '/cookies' },
          { label: 'ANPC', href: '/anpc' },
        ],
      },
    ],
    bottomText:
      'ACA STRATEGIC SOLUTIONS S.R.L. | CUI: 52313191 | Reg. Com: J2025060195004 | Address: Calea Moinesti 24, Bacau, Romania | Copyright 2026 OpenStaff.eu. All rights reserved.',
  },
  branding: {
    primaryColor: '#1A237E',
    accentColor: '#00E676',
    backgroundColor: '#F5F7FA',
    textColor: '#263238',
  },
};
