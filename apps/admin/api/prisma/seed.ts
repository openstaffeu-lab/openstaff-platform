import { AgentType, PrismaClient, TaxonomyType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.currency.createMany({
    skipDuplicates: true,
    data: [
      { code: 'RON', symbol: 'lei', name: 'Leu romanesc' },
      { code: 'EUR', symbol: 'EUR', name: 'Euro' },
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'GBP', symbol: 'GBP', name: 'Pound Sterling' },
      { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    ],
  });

  const naceData = [
    { code: '43.21', label: 'Lucrari de instalatii electrice', labelEn: 'Electrical installation' },
    { code: '43.22', label: 'Lucrari de instalatii sanitare', labelEn: 'Plumbing installation' },
    { code: '43.29', label: 'Alte lucrari de instalatii', labelEn: 'Other installation' },
    { code: '43.31', label: 'Lucrari de tencuire', labelEn: 'Plastering' },
    { code: '43.32', label: 'Lucrari de tamplarie si dulgherie', labelEn: 'Joinery' },
    { code: '41.20', label: 'Constructia de cladiri rezidentiale', labelEn: 'Residential construction' },
    { code: '42.22', label: 'Constructia de retele electrice', labelEn: 'Utility construction' },
    { code: '35.11', label: 'Productia de energie electrica', labelEn: 'Electricity production' },
    { code: '35.14', label: 'Comert energie electrica', labelEn: 'Energy trading' },
    { code: '56.10', label: 'Restaurante si alte activitati Horeca', labelEn: 'Restaurants' },
    { code: '55.10', label: 'Hoteluri si alte facilitati de cazare', labelEn: 'Hotels' },
    { code: '38.11', label: 'Colectarea deseurilor', labelEn: 'Waste collection' },
    { code: '81.30', label: 'Activitati de intretinere peisagistica', labelEn: 'Landscaping' },
    { code: '61.10', label: 'Activitati de telecomunicatii prin cablu', labelEn: 'Cable telecom' },
    { code: '62.01', label: 'Activitati de realizare a soft-ului', labelEn: 'Software development' },
    { code: '71.12', label: 'Activitati de inginerie', labelEn: 'Engineering activities' },
    { code: '74.10', label: 'Activitati de design specializat', labelEn: 'Specialized design' },
    { code: '49.41', label: 'Transporturi rutiere de marfuri', labelEn: 'Road freight' },
    { code: '52.10', label: 'Depozitare', labelEn: 'Warehousing' },
    { code: '86.10', label: 'Activitati ale spitalelor', labelEn: 'Hospital activities' },
    { code: '26.12', label: 'Fabricare placi de circuit imprimat', labelEn: 'PCB manufacturing' },
    { code: '26.20', label: 'Fabricare calculatoare', labelEn: 'Computer manufacturing' },
    { code: '27.11', label: 'Fabricare motoare electrice', labelEn: 'Electric motors' },
    { code: '33.20', label: 'Instalare echipamente industriale', labelEn: 'Industrial installation' },
    { code: '43.11', label: 'Lucrari de demolare', labelEn: 'Demolition' },
    { code: '43.12', label: 'Lucrari de pregatire a terenului', labelEn: 'Site preparation' },
    { code: '43.91', label: 'Lucrari de invelitori, sarpante', labelEn: 'Roofing' },
    { code: '43.99', label: 'Alte lucrari speciale de constructii', labelEn: 'Other construction' },
    { code: '80.10', label: 'Activitati de securitate privata', labelEn: 'Private security' },
    { code: '82.11', label: 'Servicii administrative combinate', labelEn: 'Admin services' },
  ];

  for (const item of naceData) {
    await prisma.taxonomy.upsert({
      where: {
        code_type: {
          code: item.code,
          type: TaxonomyType.NACE,
        },
      },
      create: {
        code: item.code,
        type: TaxonomyType.NACE,
        label: item.label,
        labelEn: item.labelEn,
      },
      update: {
        label: item.label,
        labelEn: item.labelEn,
      },
    });
  }

  const escoData = [
    { code: '7411.1', label: 'Electrician de constructii', labelEn: 'Construction electrician' },
    { code: '7412.1', label: 'Electrician industrial', labelEn: 'Industrial electrician' },
    { code: '7422.1', label: 'Instalator apa si canal', labelEn: 'Plumber' },
    { code: '7212.1', label: 'Sudor', labelEn: 'Welder' },
    { code: '7114.1', label: 'Zidar', labelEn: 'Bricklayer' },
    { code: '7115.1', label: 'Tamplar', labelEn: 'Carpenter' },
    { code: '7121.1', label: 'Acoperisar', labelEn: 'Roofer' },
    { code: '7131.1', label: 'Vopsitor constructor', labelEn: 'Building painter' },
    { code: '3113.1', label: 'Tehnician electrician', labelEn: 'Electrical technician' },
    { code: '3115.1', label: 'Tehnician mecanic', labelEn: 'Mechanical technician' },
    { code: '2152.1', label: 'Inginer electrotehnic', labelEn: 'Electrical engineer' },
    { code: '2151.1', label: 'Inginer electronic', labelEn: 'Electronics engineer' },
    { code: '2153.1', label: 'Inginer energetica', labelEn: 'Energy engineer' },
    { code: '7421.2', label: 'Electronist', labelEn: 'Electronics worker' },
    { code: '5131.1', label: 'Chelner / Ospatar', labelEn: 'Waiter' },
    { code: '5120.1', label: 'Bucatar', labelEn: 'Cook' },
    { code: '9112.1', label: 'Muncitor necalificat constructii', labelEn: 'Construction laborer' },
    { code: '4321.1', label: 'Operator depozit', labelEn: 'Stock clerk' },
    { code: '8332.1', label: 'Sofer camion', labelEn: 'Truck driver' },
    { code: '3513.1', label: 'Tehnician retele IT', labelEn: 'Network technician' },
  ];

  for (const item of escoData) {
    await prisma.taxonomy.upsert({
      where: {
        code_type: {
          code: item.code,
          type: TaxonomyType.ESCO,
        },
      },
      create: {
        code: item.code,
        type: TaxonomyType.ESCO,
        label: item.label,
        labelEn: item.labelEn,
      },
      update: {
        label: item.label,
        labelEn: item.labelEn,
      },
    });
  }

  const uniclassData = [
    { code: 'Ss_25_30_95', label: 'Electrical power systems', labelEn: 'Electrical power systems' },
    { code: 'Ss_65_40', label: 'HVAC systems', labelEn: 'HVAC systems' },
    { code: 'Ss_40_10', label: 'Pipework systems', labelEn: 'Pipework systems' },
    { code: 'Pr_20_76', label: 'Automation systems', labelEn: 'Automation systems' },
    { code: 'Ac_05_90', label: 'Food service assets', labelEn: 'Food service assets' },
  ];

  for (const item of uniclassData) {
    await prisma.taxonomy.upsert({
      where: {
        code_type: {
          code: item.code,
          type: TaxonomyType.UNICLASS,
        },
      },
      create: {
        code: item.code,
        type: TaxonomyType.UNICLASS,
        label: item.label,
        labelEn: item.labelEn,
      },
      update: {
        label: item.label,
        labelEn: item.labelEn,
      },
    });
  }

  await prisma.geminiAgent.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Relu AI Chatbot Public',
        type: AgentType.CHATBOT_PUBLIC,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.7,
        systemPrompt:
          'You are Relu AI, the OpenStaff assistant. Help professionals and companies connect for projects in Data Center, Photovoltaic, Horeca, Environment, Construction, PCB Design, and Logistics. Reply in the detected user language and suggest NACE and ESCO mappings when relevant. Do not invent facts.',
      },
      {
        name: 'Document OCR Analyzer',
        type: AgentType.DOCUMENT_OCR,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.1,
        systemPrompt:
          'Extract structured fields from Romanian and EU official documents. Return valid JSON only with name, cnp_cui, series, issued, expires, authority, and confidence.',
      },
      {
        name: 'Contract Generator',
        type: AgentType.CONTRACT_GENERATOR,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.3,
        systemPrompt:
          'Generate Romanian service contract drafts with parties, scope, duration, payment terms, penalties, and compliance clauses in structured Markdown.',
      },
      {
        name: 'Compliance Monitor',
        type: AgentType.COMPLIANCE_MONITOR,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.2,
        systemPrompt:
          'Review contracts and documents for Romanian and EU labor compliance. Return JSON with issues, risk_level, and recommendations.',
      },
      {
        name: 'PCB Design Assistant',
        type: AgentType.PCB_DESIGN_ASSISTANT,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.6,
        systemPrompt:
          'Assist with PCB design, photovoltaic inverter layouts, data center cabling, PLC and SCADA automation, BOMs, and technical recommendations.',
      },
      {
        name: 'Matching Engine',
        type: AgentType.MATCHING_ENGINE,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.3,
        systemPrompt:
          'Score compatibility between a job and a professional using NACE, ESCO, experience, rating, region, and availability. Return JSON only with score, reasons, and recommendation.',
      },
      {
        name: 'Test Form Generator',
        type: AgentType.TEST_FORM_GENERATOR,
        model: 'gemini-1.5-pro-latest',
        temperature: 0.5,
        systemPrompt:
          'Generate 7-question technical evaluation forms for jobs. Return JSON only with multiple-choice, open, and practical questions totaling 100 points.',
      },
    ],
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
