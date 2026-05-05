export type TaxonomySource = 'ESCO' | 'NACE' | 'UNICLASS' | 'CUSTOM';

export type TaxonomySourceDocument = {
  id: string;
  name: string;
  source: TaxonomySource;
  locale: 'en' | 'ro' | 'multi';
  format: 'csv' | 'xlsx' | 'pdf' | 'zip';
  note: string;
};

export type TaxonomyIndustry = {
  id: string;
  name: string;
  slug: string;
  source: TaxonomySource;
};

export type TaxonomyCategory = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  source: TaxonomySource;
};

export type TaxonomySkill = {
  name: string;
  relationType: 'essential' | 'optional';
  source: TaxonomySource;
};

export type TaxonomyMappingEntry = {
  code: string;
  label: string;
  uri?: string;
};

export type TaxonomyProfession = {
  id: string;
  name: string;
  slug: string;
  industry: string;
  category: string;
  source: TaxonomySource;
  labels: {
    en: string;
    ro?: string;
  };
  descriptions: {
    en: string;
    ro?: string;
  };
  tags: string[];
  skills: TaxonomySkill[];
  mappings: {
    esco: string[];
    nace: string[];
    uniclass: string[];
  };
  references: {
    escoOccupation?: TaxonomyMappingEntry;
    nace: TaxonomyMappingEntry[];
    uniclass: TaxonomyMappingEntry[];
    sourceFiles: string[];
  };
};

export const taxonomySourceCatalog: TaxonomySourceDocument[] = [
  {
    id: 'esco-occupations-en',
    name: 'occupations_en.csv',
    source: 'ESCO',
    locale: 'en',
    format: 'csv',
    note: 'Primary ESCO occupation labels, codes, URIs, and descriptions.',
  },
  {
    id: 'esco-occupations-ro',
    name: 'occupations_ro.csv',
    source: 'ESCO',
    locale: 'ro',
    format: 'csv',
    note: 'Romanian labels for ESCO occupations used for localized taxonomy mapping.',
  },
  {
    id: 'esco-occupation-skill-relations-en',
    name: 'occupationSkillRelations_en.csv',
    source: 'ESCO',
    locale: 'en',
    format: 'csv',
    note: 'Links occupations to essential and optional skills.',
  },
  {
    id: 'nace-activities-2-1',
    name: 'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
    source: 'NACE',
    locale: 'multi',
    format: 'xlsx',
    note: 'NACE 2.1 activity mapping used to validate industry and category codes.',
  },
  {
    id: 'nace-rev-2-1-zip',
    name: 'NACE_Rev.2.1.zip',
    source: 'NACE',
    locale: 'multi',
    format: 'zip',
    note: 'Distribution package for the NACE 2.1 classification reference.',
  },
  {
    id: 'caen-meserii-pdf',
    name: 'Nomenclatorul-CAEN-de-Meserii-Ordonat-Alfabetic.pdf',
    source: 'NACE',
    locale: 'ro',
    format: 'pdf',
    note: 'Romanian alphabetical professions reference aligned with CAEN/NACE usage.',
  },
  {
    id: 'uniclass-ac',
    name: 'Uniclass2015_Ac_v1_25.xlsx',
    source: 'UNICLASS',
    locale: 'en',
    format: 'xlsx',
    note: 'Uniclass activity reference for hotel, SPA, food service, and retail assets.',
  },
  {
    id: 'uniclass-ss',
    name: 'Uniclass2015_Ss_v1_41.xlsx',
    source: 'UNICLASS',
    locale: 'en',
    format: 'xlsx',
    note: 'Uniclass systems reference for electrical, HVAC, and pipework systems.',
  },
];

export const taxonomyIndustries: TaxonomyIndustry[] = [
  {
    id: 'construction',
    name: 'Construction',
    slug: 'construction',
    source: 'UNICLASS',
  },
  {
    id: 'tourism',
    name: 'Tourism',
    slug: 'tourism',
    source: 'ESCO',
  },
  {
    id: 'facilities',
    name: 'Facilities',
    slug: 'facilities',
    source: 'NACE',
  },
  {
    id: 'retail',
    name: 'Retail',
    slug: 'retail',
    source: 'NACE',
  },
];

export const taxonomyCategories: TaxonomyCategory[] = [
  {
    id: 'site-works',
    name: 'Site Works',
    slug: 'site-works',
    industry: 'construction',
    source: 'UNICLASS',
  },
  {
    id: 'building-services',
    name: 'Building Services',
    slug: 'building-services',
    industry: 'construction',
    source: 'NACE',
  },
  {
    id: 'hotels',
    name: 'Hotels',
    slug: 'hotels',
    industry: 'tourism',
    source: 'ESCO',
  },
  {
    id: 'restaurants',
    name: 'Restaurants',
    slug: 'restaurants',
    industry: 'tourism',
    source: 'ESCO',
  },
  {
    id: 'spa',
    name: 'SPA',
    slug: 'spa',
    industry: 'tourism',
    source: 'ESCO',
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    slug: 'maintenance',
    industry: 'facilities',
    source: 'NACE',
  },
  {
    id: 'sales',
    name: 'Sales',
    slug: 'sales',
    industry: 'retail',
    source: 'NACE',
  },
];

export const taxonomyProfessions: TaxonomyProfession[] = [
  {
    id: 'waiter',
    name: 'Waiter',
    slug: 'waiter',
    industry: 'tourism',
    category: 'restaurants',
    source: 'ESCO',
    labels: {
      en: 'Waiter / Waitress',
      ro: 'Ospatar / Ospatarita',
    },
    descriptions: {
      en: 'Waiters and waitresses supply guests with food and drinks in restaurants, bars, and hotels, while managing service flow and payments.',
      ro: 'Ospatarii servesc preparate si bauturi clientilor si gestioneaza relatia operationala cu acestia in restaurante, baruri si hoteluri.',
    },
    tags: ['hospitality', 'service', 'restaurant', 'guest-experience'],
    skills: [
      { name: 'assist customers', relationType: 'essential', source: 'ESCO' },
      { name: 'serve food and beverages', relationType: 'essential', source: 'ESCO' },
      { name: 'handle payments', relationType: 'essential', source: 'ESCO' },
      { name: 'prepare tables', relationType: 'essential', source: 'ESCO' },
    ],
    mappings: {
      esco: ['waiter/waitress', '5131.2'],
      nace: ['I56'],
      uniclass: ['Ac_05_90'],
    },
    references: {
      escoOccupation: {
        code: '5131.2',
        label: 'waiter/waitress',
        uri: 'http://data.europa.eu/esco/occupation/d5db9d5c-2ebf-4a54-a79a-1b7e7ff70471',
      },
      nace: [
        { code: 'I56', label: 'Food and beverage service activities' },
      ],
      uniclass: [{ code: 'Ac_05_90', label: 'Food service assets' }],
      sourceFiles: [
        'occupations_en.csv',
        'occupations_ro.csv',
        'occupationSkillRelations_en.csv',
      ],
    },
  },
  {
    id: 'chef',
    name: 'Chef',
    slug: 'chef',
    industry: 'tourism',
    category: 'restaurants',
    source: 'ESCO',
    labels: {
      en: 'Chef',
      ro: 'Bucatar sef / Bucatareasa sefa',
    },
    descriptions: {
      en: 'Chefs are culinary professionals responsible for menu execution, creativity, food quality, and hospitality kitchen operations.',
      ro: 'Bucatarii sefi coordoneaza executia meniului, calitatea preparatelor si operatiunile din bucatarie.',
    },
    tags: ['kitchen', 'food', 'hospitality', 'menu-engineering'],
    skills: [
      { name: 'comply with food safety and hygiene', relationType: 'essential', source: 'ESCO' },
      { name: 'use food preparation techniques', relationType: 'essential', source: 'ESCO' },
      { name: 'think creatively about food and beverages', relationType: 'essential', source: 'ESCO' },
      { name: 'manage staff', relationType: 'essential', source: 'ESCO' },
      { name: 'plan menus', relationType: 'essential', source: 'ESCO' },
      { name: 'manage budgets', relationType: 'essential', source: 'ESCO' },
    ],
    mappings: {
      esco: ['chef', '3434.1'],
      nace: ['I56', '5611'],
      uniclass: ['Ac_05_90'],
    },
    references: {
      escoOccupation: {
        code: '3434.1',
        label: 'chef',
        uri: 'http://data.europa.eu/esco/occupation/1009be17-7efd-45f1-a033-566bf179c588',
      },
      nace: [
        { code: 'I56', label: 'Food and beverage service activities' },
        { code: '5611', label: 'Restaurants and mobile food service activities' },
      ],
      uniclass: [{ code: 'Ac_05_90', label: 'Food service assets' }],
      sourceFiles: [
        'occupations_en.csv',
        'occupations_ro.csv',
        'occupationSkillRelations_en.csv',
      ],
    },
  },
  {
    id: 'hotel-manager',
    name: 'Hotel Manager',
    slug: 'hotel-manager',
    industry: 'tourism',
    category: 'hotels',
    source: 'ESCO',
    labels: {
      en: 'Hotel Manager',
      ro: 'Manager hotel',
    },
    descriptions: {
      en: 'Hotel managers coordinate accommodation operations, guest experience, staffing, and commercial performance across hotel assets.',
      ro: 'Managerii de hotel coordoneaza operatiunile de cazare, experienta clientilor si performanta comerciala a hotelului.',
    },
    tags: ['hotel', 'management', 'operations', 'guest-experience'],
    skills: [
      { name: 'manage hospitality revenue', relationType: 'essential', source: 'ESCO' },
      { name: 'manage staff', relationType: 'essential', source: 'ESCO' },
      { name: 'handle customer complaints', relationType: 'essential', source: 'ESCO' },
      { name: 'plan shifts of employees', relationType: 'essential', source: 'ESCO' },
    ],
    mappings: {
      esco: ['hotel-manager'],
      nace: ['I55'],
      uniclass: ['Ac_05_70'],
    },
    references: {
      nace: [{ code: 'I55', label: 'Accommodation' }],
      uniclass: [{ code: 'Ac_05_70', label: 'Hotel operational assets' }],
      sourceFiles: [
        'occupations_en.csv',
        'occupations_ro.csv',
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
      ],
    },
  },
  {
    id: 'spa-therapist',
    name: 'SPA Therapist',
    slug: 'spa-therapist',
    industry: 'tourism',
    category: 'spa',
    source: 'CUSTOM',
    labels: {
      en: 'SPA Therapist',
      ro: 'Terapeut SPA',
    },
    descriptions: {
      en: 'SPA therapists deliver wellness treatments, guest care, hygiene, and service continuity inside SPA and wellness environments.',
      ro: 'Terapeutii SPA livreaza tratamente de wellness, ingrijire pentru clienti si standarde de igiena in medii SPA.',
    },
    tags: ['spa', 'wellness', 'therapy', 'guest-care'],
    skills: [
      { name: 'prepare treatment room', relationType: 'essential', source: 'CUSTOM' },
      { name: 'apply guest care standards', relationType: 'essential', source: 'CUSTOM' },
      { name: 'maintain hygiene procedures', relationType: 'essential', source: 'CUSTOM' },
      { name: 'promote wellness services', relationType: 'optional', source: 'CUSTOM' },
    ],
    mappings: {
      esco: ['massage therapist-adjacent'],
      nace: ['S96'],
      uniclass: ['Ac_05_80'],
    },
    references: {
      nace: [{ code: 'S96', label: 'Other personal service activities' }],
      uniclass: [{ code: 'Ac_05_80', label: 'Wellness and SPA assets' }],
      sourceFiles: [
        'Nomenclatorul-CAEN-de-Meserii-Ordonat-Alfabetic.pdf',
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
        'Uniclass2015_Ac_v1_25.xlsx',
      ],
    },
  },
  {
    id: 'electrician',
    name: 'Electrician',
    slug: 'electrician',
    industry: 'construction',
    category: 'site-works',
    source: 'ESCO',
    labels: {
      en: 'Electrician',
      ro: 'Electrician / Electriciana',
    },
    descriptions: {
      en: 'Electricians fit, repair, install, and maintain electrical wiring systems, circuits, and equipment across many facility types.',
      ro: 'Electricienii instaleaza, repara si mentin circuite, cablaje si echipamente electrice in multiple tipuri de cladiri si facilitati.',
    },
    tags: ['electrical', 'construction', 'maintenance', 'power-systems'],
    skills: [
      { name: 'install electrical wiring', relationType: 'essential', source: 'ESCO' },
      { name: 'maintain electrical equipment', relationType: 'essential', source: 'ESCO' },
      { name: 'inspect electrical systems', relationType: 'essential', source: 'ESCO' },
      { name: 'diagnose electrical faults', relationType: 'essential', source: 'ESCO' },
    ],
    mappings: {
      esco: ['electrician', '7411.1'],
      nace: ['F43', '4321'],
      uniclass: ['Ss_25_30'],
    },
    references: {
      escoOccupation: {
        code: '7411.1',
        label: 'electrician',
        uri: 'http://data.europa.eu/esco/occupation/4910419f-b4af-4f59-b544-9dbebc8a74f0',
      },
      nace: [
        { code: 'F43', label: 'Specialised construction activities' },
        { code: '4321', label: 'Electrical installation' },
      ],
      uniclass: [{ code: 'Ss_25_30', label: 'Electrical power systems' }],
      sourceFiles: [
        'occupations_en.csv',
        'occupations_ro.csv',
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
        'Uniclass2015_Ss_v1_41.xlsx',
      ],
    },
  },
  {
    id: 'plumber',
    name: 'Plumber',
    slug: 'plumber',
    industry: 'construction',
    category: 'building-services',
    source: 'ESCO',
    labels: {
      en: 'Plumber',
      ro: 'Instalator / Instalatoare',
    },
    descriptions: {
      en: 'Plumbers install and maintain water, gas, and sewage systems, inspect fixtures, and make repairs following safety regulations.',
      ro: 'Instalatorii monteaza si mentin sisteme de apa, gaze si canalizare si executa reparatii in conditii de siguranta.',
    },
    tags: ['installations', 'water', 'maintenance', 'pipework'],
    skills: [
      { name: 'install pipes', relationType: 'essential', source: 'ESCO' },
      { name: 'inspect pipes and fixtures', relationType: 'essential', source: 'ESCO' },
      { name: 'test systems safely', relationType: 'essential', source: 'ESCO' },
      { name: 'place sanitary equipment', relationType: 'essential', source: 'ESCO' },
    ],
    mappings: {
      esco: ['plumber', '7126.8'],
      nace: ['F43', '4322'],
      uniclass: ['Ss_40_10'],
    },
    references: {
      escoOccupation: {
        code: '7126.8',
        label: 'plumber',
        uri: 'http://data.europa.eu/esco/occupation/ed3cf43d-c2c1-4c46-82fc-1375e27e0290',
      },
      nace: [
        { code: 'F43', label: 'Specialised construction activities' },
        { code: '4322', label: 'Plumbing, heat and air-conditioning installation' },
      ],
      uniclass: [{ code: 'Ss_40_10', label: 'Pipework systems' }],
      sourceFiles: [
        'occupations_en.csv',
        'occupations_ro.csv',
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
        'Uniclass2015_Ss_v1_41.xlsx',
      ],
    },
  },
  {
    id: 'sales-agent',
    name: 'Sales Agent',
    slug: 'sales-agent',
    industry: 'retail',
    category: 'sales',
    source: 'ESCO',
    labels: {
      en: 'Sales Agent',
      ro: 'Agent de vanzari',
    },
    descriptions: {
      en: 'Sales agents support direct sales flows, customer interactions, reservations, ticketing, and after-sales follow-up across retail-like environments.',
      ro: 'Agentii de vanzari sustin procese comerciale directe, interactiunea cu clientii si activitati de follow-up dupa vanzare.',
    },
    tags: ['sales', 'retail', 'customer', 'commercial'],
    skills: [
      { name: 'provide customer information', relationType: 'essential', source: 'ESCO' },
      { name: 'handle sales transactions', relationType: 'essential', source: 'ESCO' },
      { name: 'fit offer to customer needs', relationType: 'essential', source: 'ESCO' },
      { name: 'follow up on after-sales', relationType: 'optional', source: 'ESCO' },
    ],
    mappings: {
      esco: ['advertising sales agent', '3339.1'],
      nace: ['G47'],
      uniclass: ['Ac_05_30'],
    },
    references: {
      escoOccupation: {
        code: '3339.1',
        label: 'advertising sales agent',
        uri: 'http://data.europa.eu/esco/occupation/f5332f2d-3119-4194-8b5c-d0a5d97f55ef',
      },
      nace: [{ code: 'G47', label: 'Retail trade' }],
      uniclass: [{ code: 'Ac_05_30', label: 'Retail operational assets' }],
      sourceFiles: [
        'occupations_en.csv',
        'occupations_ro.csv',
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
        'Uniclass2015_Ac_v1_25.xlsx',
      ],
    },
  },
  {
    id: 'facility-technician',
    name: 'Facility Technician',
    slug: 'facility-technician',
    industry: 'facilities',
    category: 'maintenance',
    source: 'CUSTOM',
    labels: {
      en: 'Facility Technician',
      ro: 'Tehnician facilitati',
    },
    descriptions: {
      en: 'Facility technicians support planned maintenance, asset continuity, HVAC coordination, and daily technical interventions across managed buildings.',
      ro: 'Tehnicienii de facilitati sustin mentenanta planificata si interventiile tehnice zilnice in cladiri administrate.',
    },
    tags: ['facilities', 'maintenance', 'technical', 'asset-operations'],
    skills: [
      { name: 'maintain building systems', relationType: 'essential', source: 'CUSTOM' },
      { name: 'coordinate technical interventions', relationType: 'essential', source: 'CUSTOM' },
      { name: 'monitor service continuity', relationType: 'essential', source: 'CUSTOM' },
      { name: 'report maintenance issues', relationType: 'essential', source: 'CUSTOM' },
    ],
    mappings: {
      esco: ['industrial-maintenance-supervisor'],
      nace: ['N81'],
      uniclass: ['Ss_65_40'],
    },
    references: {
      nace: [{ code: 'N81', label: 'Services to buildings and landscape activities' }],
      uniclass: [{ code: 'Ss_65_40', label: 'Heating, ventilation and air conditioning systems' }],
      sourceFiles: [
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
        'Uniclass2015_Ss_v1_41.xlsx',
      ],
    },
  },
  {
    id: 'site-supervisor',
    name: 'Site Supervisor',
    slug: 'site-supervisor',
    industry: 'construction',
    category: 'site-works',
    source: 'CUSTOM',
    labels: {
      en: 'Site Supervisor',
      ro: 'Sef de santier',
    },
    descriptions: {
      en: 'Site supervisors coordinate field execution teams, safety processes, sequencing, and subcontractor control for active construction sites.',
      ro: 'Sefii de santier coordoneaza echipele din teren, siguranta si controlul subcontractorilor pe santier.',
    },
    tags: ['supervision', 'site', 'safety', 'execution-control'],
    skills: [
      { name: 'coordinate subcontractors', relationType: 'essential', source: 'CUSTOM' },
      { name: 'enforce site safety', relationType: 'essential', source: 'CUSTOM' },
      { name: 'monitor work progress', relationType: 'essential', source: 'CUSTOM' },
      { name: 'report execution status', relationType: 'essential', source: 'CUSTOM' },
    ],
    mappings: {
      esco: ['site-supervisor'],
      nace: ['F41'],
      uniclass: ['Ss_25_30'],
    },
    references: {
      nace: [{ code: 'F41', label: 'Construction of buildings' }],
      uniclass: [{ code: 'Ss_25_30', label: 'Electrical power systems' }],
      sourceFiles: [
        'Nomenclatorul-CAEN-de-Meserii-Ordonat-Alfabetic.pdf',
        'SPACE_ACTIVITIES_NACE2.1_NACE2_Table.xlsx',
      ],
    },
  },
];

export const taxonomyTags = Array.from(
  new Set(
    taxonomyProfessions.flatMap((profession) => [
      ...profession.tags,
      ...profession.mappings.esco,
      ...profession.mappings.nace,
      ...profession.mappings.uniclass,
      ...profession.skills.map((skill) => skill.name),
    ]),
  ),
)
  .sort((left, right) => left.localeCompare(right))
  .map((tag) => ({
    id: tag,
    name: tag,
    slug: tag.toLowerCase().replace(/\s+/g, '-'),
  }));
