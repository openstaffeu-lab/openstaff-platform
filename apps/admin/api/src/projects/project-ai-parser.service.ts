import { Injectable } from '@nestjs/common';

type TaxonomyRecord = {
  id: string;
  code: string;
  title: string;
  description: string | null;
};

type ParserDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  extractedText: string | null;
  extractionStatus: string;
};

type ParserProject = {
  id: string;
  name: string;
  summary: string | null;
  location: string | null;
};

type ParserInput = {
  project: ParserProject;
  sourceText: string | null;
  documents: ParserDocument[];
  escoSkills: TaxonomyRecord[];
  naceCodes: TaxonomyRecord[];
  uniclassCodes: TaxonomyRecord[];
};

type SuggestionMatch = {
  keyword: string;
  weight?: number;
};

type TaxonomySuggestion = {
  id: string;
  code: string;
  title: string;
  reason: string;
  matchedKeywords: string[];
  score: number;
};

type ParsedAIInterpretation = {
  summary: string;
  detectedEngagementModel: 'B2B' | 'B2C' | 'MIXED' | 'UNKNOWN';
  suggestedJobRequests: Array<{
    title: string;
    reason: string;
    matchedKeywords: string[];
  }>;
  suggestedConditions: Array<{
    type:
      | 'SAFETY'
      | 'PAYMENT'
      | 'INSURANCE'
      | 'TECHNICAL'
      | 'LEGAL'
      | 'CUSTOM';
    title: string;
    content: string;
    reason: string;
  }>;
  taxonomySuggestions: {
    esco: TaxonomySuggestion[];
    nace: TaxonomySuggestion[];
    uniclass: TaxonomySuggestion[];
  };
  riskFlags: string[];
  financeFlags: string[];
  complianceFlags: string[];
  sourceStats: {
    documentIds: string[];
    documentsWithExtractedText: string[];
    totalCharacters: number;
    sourceTextCharacters: number;
    extractedDocumentCharacters: number;
  };
};

type KeywordRule = {
  title: string;
  reason: string;
  matches: SuggestionMatch[];
};

@Injectable()
export class ProjectAIParserService {
  parse(input: ParserInput): ParsedAIInterpretation {
    const sourceText = this.normalizeFreeText(input.sourceText);
    const extractedDocuments = input.documents.filter(
      (document) => document.extractedText && document.extractedText.trim().length > 0,
    );
    const extractedText = extractedDocuments
      .map((document) => document.extractedText?.trim() ?? '')
      .filter((value) => value.length > 0)
      .join('\n\n');

    const combinedText = this.limitText(
      [
        input.project.name,
        input.project.summary ?? '',
        input.project.location ?? '',
        sourceText,
        extractedText,
      ]
        .join('\n\n')
        .trim(),
      120_000,
    );
    const normalized = this.normalizeForMatching(combinedText);
    const tokens = this.tokenize(normalized);

    const detectedEngagementModel = this.detectEngagementModel(normalized);
    const suggestedJobRequests = this.collectJobRequests(normalized);
    const suggestedConditions = this.collectConditions(normalized);
    const riskFlags = this.collectFlags(normalized, [
      { title: 'Urgent mobilization required', terms: ['urgent', 'immediate mobilization', 'asap'] },
      { title: 'Penalty exposure detected', terms: ['penalty', 'penalties', 'liquidated damages'] },
      { title: 'Night or shutdown work mentioned', terms: ['night shift', 'shutdown', 'out of hours'] },
      { title: 'Hazardous or high-risk site activity', terms: ['hazardous', 'confined space', 'working at height'] },
    ]);
    const financeFlags = this.collectFlags(normalized, [
      { title: 'Advance payment requested', terms: ['advance payment', 'mobilization advance'] },
      { title: 'Retention clause likely required', terms: ['retention', 'retainage'] },
      { title: 'Extended payment terms detected', terms: ['net 30', 'net 45', 'net 60', 'invoice'] },
      { title: 'Budget or price cap language detected', terms: ['budget', 'price cap', 'lump sum', 'fixed price'] },
    ]);
    const complianceFlags = this.collectFlags(normalized, [
      { title: 'Permit or approval language detected', terms: ['permit', 'approval', 'authority'] },
      { title: 'Insurance requirement detected', terms: ['insurance', 'liability coverage'] },
      { title: 'Certification requirement detected', terms: ['certification', 'certified', 'licensed'] },
      { title: 'HSE or safety compliance language detected', terms: ['hse', 'safety plan', 'method statement'] },
      { title: 'Inspection or warranty language detected', terms: ['inspection', 'warranty', 'commissioning'] },
    ]);

    return {
      summary: this.buildSummary(input.project, sourceText, extractedText),
      detectedEngagementModel,
      suggestedJobRequests,
      suggestedConditions,
      taxonomySuggestions: {
        esco: this.scoreTaxonomySuggestions(input.escoSkills, normalized, tokens),
        nace: this.scoreTaxonomySuggestions(input.naceCodes, normalized, tokens),
        uniclass: this.scoreTaxonomySuggestions(input.uniclassCodes, normalized, tokens),
      },
      riskFlags,
      financeFlags,
      complianceFlags,
      sourceStats: {
        documentIds: input.documents.map((document) => document.id),
        documentsWithExtractedText: extractedDocuments.map((document) => document.id),
        totalCharacters: combinedText.length,
        sourceTextCharacters: sourceText.length,
        extractedDocumentCharacters: extractedText.length,
      },
    };
  }

  private buildSummary(
    project: ParserProject,
    sourceText: string,
    extractedText: string,
  ) {
    const seedText = sourceText || extractedText || project.summary || project.name;
    const sentences = seedText
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 20);
    const chosen = sentences.slice(0, 2).join(' ');

    return this.limitText(
      chosen ||
        `${project.name} is being prepared as a structured contractor project workspace with workforce requests, clauses, and document-backed intake notes.`,
      320,
    );
  }

  private detectEngagementModel(text: string) {
    const b2bSignals = [
      'contractor',
      'subcontractor',
      'supplier',
      'tender',
      'procurement',
      'commercial',
      'industrial',
      'site manager',
      'company',
      'bid',
    ];
    const b2cSignals = [
      'homeowner',
      'private client',
      'residential customer',
      'apartment owner',
      'villa',
      'household',
      'family home',
      'consumer',
    ];

    const b2bMatches = this.countMatches(text, b2bSignals);
    const b2cMatches = this.countMatches(text, b2cSignals);

    if (b2bMatches > 0 && b2cMatches > 0) {
      return 'MIXED';
    }

    if (b2bMatches > 0) {
      return 'B2B';
    }

    if (b2cMatches > 0) {
      return 'B2C';
    }

    return 'UNKNOWN';
  }

  private collectJobRequests(text: string) {
    const rules: KeywordRule[] = [
      {
        title: 'Electrical Installation Team',
        reason: 'Electrical delivery language appears in the source material.',
        matches: [
          { keyword: 'electrical', weight: 2 },
          { keyword: 'electrician', weight: 2 },
          { keyword: 'cable tray' },
          { keyword: 'power supply' },
          { keyword: 'lighting' },
        ],
      },
      {
        title: 'HVAC Installation Crew',
        reason: 'HVAC and mechanical systems are referenced in the source material.',
        matches: [
          { keyword: 'hvac', weight: 2 },
          { keyword: 'ventilation', weight: 2 },
          { keyword: 'air conditioning' },
          { keyword: 'heating' },
          { keyword: 'duct' },
        ],
      },
      {
        title: 'Plumbing and Sanitary Team',
        reason: 'Plumbing or sanitary works appear in the project intake.',
        matches: [
          { keyword: 'plumbing', weight: 2 },
          { keyword: 'sanitary', weight: 2 },
          { keyword: 'pipework' },
          { keyword: 'drainage' },
          { keyword: 'water supply' },
        ],
      },
      {
        title: 'Civil and Masonry Crew',
        reason: 'Civil or structural construction work is referenced.',
        matches: [
          { keyword: 'concrete', weight: 2 },
          { keyword: 'masonry', weight: 2 },
          { keyword: 'civil works' },
          { keyword: 'foundation' },
          { keyword: 'reinforcement' },
        ],
      },
      {
        title: 'Finishing and Fit-Out Team',
        reason: 'Interior finishing work is described in the source content.',
        matches: [
          { keyword: 'finishing', weight: 2 },
          { keyword: 'painting' },
          { keyword: 'plasterboard' },
          { keyword: 'drywall' },
          { keyword: 'fit out' },
          { keyword: 'joinery' },
        ],
      },
      {
        title: 'Site Supervision and Coordination',
        reason: 'Supervision or coordination roles are implied by project language.',
        matches: [
          { keyword: 'site manager', weight: 2 },
          { keyword: 'supervision', weight: 2 },
          { keyword: 'foreman' },
          { keyword: 'coordination' },
          { keyword: 'commissioning' },
        ],
      },
    ];

    return rules
      .map((rule) => {
        const matchedKeywords = this.collectMatchedKeywords(text, rule.matches);
        return {
          title: rule.title,
          reason: rule.reason,
          matchedKeywords,
          score: matchedKeywords.length,
        };
      })
      .filter((item) => item.matchedKeywords.length > 0)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6)
      .map(({ score: _score, ...item }) => item);
  }

  private collectConditions(text: string) {
    const rules = [
      {
        type: 'SAFETY' as const,
        title: 'Site safety and method statement compliance',
        content:
          'Contractors should provide method statements, PPE compliance, and task risk controls before mobilization.',
        reason: 'Safety-oriented language was detected in the project intake.',
        matches: ['safety', 'hse', 'ppe', 'method statement', 'risk assessment'],
      },
      {
        type: 'PAYMENT' as const,
        title: 'Payment and invoice terms',
        content:
          'Commercial submission should clearly confirm invoice timing, payment milestones, retention, and supporting documentation.',
        reason: 'Payment timing or invoice language was detected.',
        matches: ['invoice', 'payment', 'net 30', 'net 45', 'retention', 'advance payment'],
      },
      {
        type: 'INSURANCE' as const,
        title: 'Insurance and liability coverage',
        content:
          'Selected contractors should evidence liability and project insurance coverage before site access.',
        reason: 'Insurance or liability terms appear in the source material.',
        matches: ['insurance', 'liability', 'indemnity', 'coverage'],
      },
      {
        type: 'TECHNICAL' as const,
        title: 'Technical compliance with drawings and specification',
        content:
          'Execution should align with drawings, tolerances, technical specifications, and approved submittals.',
        reason: 'Technical delivery terms were found.',
        matches: ['drawing', 'specification', 'technical', 'tolerance', 'submittal'],
      },
      {
        type: 'LEGAL' as const,
        title: 'Permits, approvals, and contractual compliance',
        content:
          'The contractor should comply with permits, approvals, and applicable contract obligations before and during execution.',
        reason: 'Legal or permit language was detected.',
        matches: ['permit', 'approval', 'contract', 'legal', 'authority'],
      },
      {
        type: 'CUSTOM' as const,
        title: 'Programme and access coordination',
        content:
          'Execution should be coordinated around access windows, shutdown periods, and programme constraints.',
        reason: 'Schedule or access constraints appear in the source text.',
        matches: ['schedule', 'programme', 'shutdown', 'access', 'night shift'],
      },
    ];

    return rules
      .map((rule) => {
        const matched = this.collectMatchedKeywords(
          text,
          rule.matches.map((keyword) => ({ keyword })),
        );
        return {
          type: rule.type,
          title: rule.title,
          content: rule.content,
          reason: `${rule.reason} Keywords: ${matched.join(', ')}.`,
          matched,
        };
      })
      .filter((item) => item.matched.length > 0)
      .slice(0, 6)
      .map(({ matched: _matched, ...item }) => item);
  }

  private collectFlags(
    text: string,
    rules: Array<{ title: string; terms: string[] }>,
  ) {
    return rules
      .filter((rule) => rule.terms.some((term) => text.includes(term)))
      .map((rule) => rule.title);
  }

  private scoreTaxonomySuggestions(
    records: TaxonomyRecord[],
    normalizedText: string,
    tokens: string[],
  ) {
    const tokenSet = new Set(tokens);

    return records
      .map((record) => {
        const normalizedTitle = this.normalizeForMatching(record.title);
        const normalizedDescription = this.normalizeForMatching(record.description ?? '');
        const titleTokens = this.tokenize(normalizedTitle).filter((token) => token.length > 2);
        const descriptionTokens = this.tokenize(normalizedDescription).filter(
          (token) => token.length > 3,
        );
        const matchedKeywords = [
          ...titleTokens.filter((token) => tokenSet.has(token)),
          ...descriptionTokens.filter((token) => tokenSet.has(token)).slice(0, 2),
          ...(normalizedText.includes(record.code.toLowerCase()) ? [record.code] : []),
        ].filter((value, index, collection) => collection.indexOf(value) === index);

        const phraseBonus = normalizedTitle.length > 0 && normalizedText.includes(normalizedTitle)
          ? 3
          : 0;
        const score =
          matchedKeywords.length +
          phraseBonus +
          (normalizedText.includes(record.code.toLowerCase()) ? 4 : 0);

        return {
          id: record.id,
          code: record.code,
          title: record.title,
          matchedKeywords,
          score,
        };
      })
      .filter((item) => item.score > 1)
      .sort((left, right) => right.score - left.score)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        reason: `Matched ${item.matchedKeywords.join(', ')} in project intake text.`,
      }));
  }

  private collectMatchedKeywords(text: string, matches: SuggestionMatch[]) {
    return matches
      .filter((match) => text.includes(match.keyword))
      .flatMap((match) => Array.from({ length: match.weight ?? 1 }, () => match.keyword))
      .filter((value, index, collection) => collection.indexOf(value) === index);
  }

  private countMatches(text: string, keywords: string[]) {
    return keywords.filter((keyword) => text.includes(keyword)).length;
  }

  private normalizeFreeText(value: string | null | undefined) {
    return (value ?? '').replace(/\u0000/g, '').trim();
  }

  private normalizeForMatching(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s./-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private tokenize(value: string) {
    return value.split(/\s+/).filter((token) => token.length > 0);
  }

  private limitText(value: string, maxLength: number) {
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }
}
