import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TaxonomyType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import {
  buildErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import { PrismaService } from '../prisma/prisma.service';
import {
  TaxonomyCategory,
  TaxonomyIndustry,
  TaxonomyProfession,
  TaxonomySkill,
  TaxonomySourceDocument,
  taxonomyCategories,
  taxonomyIndustries,
  taxonomyProfessions,
  taxonomySourceCatalog,
  taxonomyTags,
} from './taxonomy.data';

type TaxonomyTag = {
  id: string;
  name: string;
  slug: string;
};

type TaxonomyCatalog = {
  sources: TaxonomySourceDocument[];
  industries: TaxonomyIndustry[];
  categories: TaxonomyCategory[];
  professions: TaxonomyProfession[];
  tags: TaxonomyTag[];
};

type UploadedImportFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type TaxonomyImportEntityTypeValue =
  | 'ESCO'
  | 'NACE'
  | 'UNICLASS'
  | 'COUNTRIES'
  | 'REGIONS'
  | 'CITIES'
  | 'VAT'
  | 'CURRENCIES'
  | 'PROFESSIONS'
  | 'CERTIFICATIONS'
  | 'INDUSTRIES'
  | 'PROJECT_CATEGORIES';

type ParsedImportRow = {
  rowNumber: number;
  raw: Record<string, unknown>;
};

type NormalizedImportRow = {
  rowNumber: number;
  key: string;
  entityType: TaxonomyImportEntityTypeValue;
  action: 'create' | 'update';
  payload: Record<string, unknown>;
  duplicateInFile: boolean;
};

type ValidationIssue = {
  rowNumber: number;
  key: string | null;
  code: string;
  message: string;
};

type ValidationResult = {
  normalizedRows: NormalizedImportRow[];
  errors: ValidationIssue[];
  preview: Array<Record<string, unknown>>;
  duplicateSummary: {
    duplicateKeysInFile: string[];
    createCount: number;
    updateCount: number;
  };
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    createCount: number;
    updateCount: number;
    duplicateKeysInFile: number;
  };
};

const SUPPORTED_IMPORT_TYPES: Array<{
  value: TaxonomyImportEntityTypeValue;
  label: string;
  description: string;
}> = [
  {
    value: 'ESCO',
    label: 'ESCO',
    description:
      'Import ESCO code, label, labelEn, and optional parentCode rows.',
  },
  {
    value: 'NACE',
    label: 'NACE',
    description:
      'Import NACE code, label, labelEn, and optional parentCode rows.',
  },
  {
    value: 'UNICLASS',
    label: 'Uniclass',
    description:
      'Import Uniclass code, label, labelEn, and optional parentCode rows.',
  },
  {
    value: 'COUNTRIES',
    label: 'Countries',
    description: 'Import countries with code, name, currency, and vatRate.',
  },
  {
    value: 'REGIONS',
    label: 'Regions',
    description: 'Import regions with name and countryCode.',
  },
  {
    value: 'CITIES',
    label: 'Cities',
    description: 'Import cities with name, regionName, and countryCode.',
  },
  {
    value: 'VAT',
    label: 'VAT',
    description: 'Update country VAT by countryCode and vatRate.',
  },
  {
    value: 'CURRENCIES',
    label: 'Currencies',
    description: 'Import currency code, name, and symbol.',
  },
  {
    value: 'PROFESSIONS',
    label: 'Professions',
    description:
      'Import profession key, slug, name, industrySlug, categorySlug, and mappings.',
  },
  {
    value: 'CERTIFICATIONS',
    label: 'Certifications',
    description:
      'Import certification code, name, issuer, category, and description.',
  },
  {
    value: 'INDUSTRIES',
    label: 'Industries',
    description: 'Import industry key, slug, name, and source.',
  },
  {
    value: 'PROJECT_CATEGORIES',
    label: 'Project categories',
    description: 'Import category key, slug, name, industrySlug, and source.',
  },
];

@Injectable()
export class TaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    const catalog = await this.getCatalog();

    return {
      status: 'ok',
      source: catalog.source,
      data: catalog.data,
    };
  }

  async search(query = '') {
    const catalog = await this.getCatalog();
    const normalizedQuery = query.trim().toLowerCase();

    const data = normalizedQuery
      ? catalog.data.professions.filter((profession) => {
          return (
            profession.name.toLowerCase().includes(normalizedQuery) ||
            profession.industry.toLowerCase().includes(normalizedQuery) ||
            profession.category.toLowerCase().includes(normalizedQuery) ||
            profession.labels.en.toLowerCase().includes(normalizedQuery) ||
            profession.labels.ro?.toLowerCase().includes(normalizedQuery) ||
            profession.descriptions.en
              .toLowerCase()
              .includes(normalizedQuery) ||
            profession.descriptions.ro
              ?.toLowerCase()
              .includes(normalizedQuery) ||
            profession.tags.some((tag) =>
              tag.toLowerCase().includes(normalizedQuery),
            ) ||
            profession.skills.some((skill) =>
              skill.name.toLowerCase().includes(normalizedQuery),
            ) ||
            profession.mappings.esco.some((tag) =>
              tag.toLowerCase().includes(normalizedQuery),
            ) ||
            profession.mappings.nace.some((tag) =>
              tag.toLowerCase().includes(normalizedQuery),
            ) ||
            profession.mappings.uniclass.some((tag) =>
              tag.toLowerCase().includes(normalizedQuery),
            ) ||
            profession.references.sourceFiles.some((fileName) =>
              fileName.toLowerCase().includes(normalizedQuery),
            )
          );
        })
      : catalog.data.professions;

    return {
      status: 'ok',
      source: catalog.source,
      data,
    };
  }

  async byIndustry(industrySlug: string) {
    const catalog = await this.getCatalog();
    const industry =
      catalog.data.industries.find((item) => item.slug === industrySlug) ??
      null;
    const categories = catalog.data.categories.filter(
      (category) => category.industry === industrySlug,
    );
    const professions = catalog.data.professions.filter(
      (profession) => profession.industry === industrySlug,
    );
    const tags = catalog.data.tags.filter((tag) =>
      professions.some((profession) =>
        [
          ...profession.tags,
          ...profession.mappings.esco,
          ...profession.mappings.nace,
          ...profession.mappings.uniclass,
          ...profession.skills.map((skill) => skill.name),
        ].includes(tag.id),
      ),
    );
    const sources = catalog.data.sources.filter((source) =>
      professions.some((profession) =>
        profession.references.sourceFiles.includes(source.name),
      ),
    );

    return {
      status: 'ok',
      source: catalog.source,
      data: {
        industry,
        categories,
        professions,
        tags,
        sources,
      },
    };
  }

  async createProfession(body: Record<string, unknown>) {
    const payload = this.normalizeProfessionPayload(body);

    try {
      const created = await this.prisma.taxonomyProfessionRecord.create({
        data: payload as any,
      });

      return buildSuccessResponse(created);
    } catch (error) {
      logEndpointError('TaxonomyService.createProfession', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildErrorResponse(
          'Profession persistence is unavailable',
          'Database connection or schema is not ready for taxonomy writes.',
        );
      }

      throw error;
    }
  }

  async updateProfession(id: string, body: Record<string, unknown>) {
    const payload = this.normalizeProfessionPayload(body, true);

    try {
      const updated = await this.prisma.taxonomyProfessionRecord.update({
        where: { id },
        data: payload as any,
      });

      return buildSuccessResponse(updated);
    } catch (error) {
      logEndpointError('TaxonomyService.updateProfession', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildErrorResponse(
          'Profession persistence is unavailable',
          'Database connection or schema is not ready for taxonomy writes.',
        );
      }

      throw error;
    }
  }

  async searchByType(type: TaxonomyType, query = '', limit = 10) {
    const normalizedLimit = Math.min(Math.max(limit, 1), 50);
    try {
      return await this.prisma.taxonomy.findMany({
        where: {
          type,
          ...(query.trim()
            ? {
                OR: [
                  { code: { contains: query, mode: 'insensitive' } },
                  { label: { contains: query, mode: 'insensitive' } },
                  { labelEn: { contains: query, mode: 'insensitive' } },
                ],
              }
            : {}),
        },
        orderBy: [{ label: 'asc' }],
        take: normalizedLimit,
      });
    } catch (error) {
      logEndpointError('TaxonomyService.searchByType', error);
      return [];
    }
  }

  async importBulk(entries: Array<Record<string, unknown>>) {
    let imported = 0;

    for (const entry of entries) {
      const code = this.stringFromRow(entry, ['code']);
      const type = entry.type as TaxonomyType | undefined;
      const label = this.stringFromRow(entry, ['label']);

      if (!code || !type || !label) {
        continue;
      }

      await this.prisma.taxonomy.upsert({
        where: {
          code_type: {
            code,
            type,
          },
        },
        update: {
          label,
          labelEn: this.nullableStringFromRow(entry, ['labelEn']),
          parentId: this.nullableStringFromRow(entry, ['parentId']),
        },
        create: {
          code,
          type,
          label,
          labelEn: this.nullableStringFromRow(entry, ['labelEn']),
          parentId: this.nullableStringFromRow(entry, ['parentId']),
        },
      });

      imported += 1;
    }

    return buildSuccessResponse({ imported });
  }

  async getImportOptions() {
    return buildSuccessResponse({
      supportedTypes: SUPPORTED_IMPORT_TYPES,
      acceptedFileTypes: ['.csv'],
    });
  }

  async uploadImport(
    entityType: string,
    file: UploadedImportFile | undefined,
    createdById: string | null,
  ) {
    if (!this.isSupportedImportType(entityType)) {
      return buildErrorResponse(
        'Unsupported import type',
        `The import type "${entityType}" is not supported.`,
      );
    }

    if (!file) {
      return buildErrorResponse('Missing file', 'A CSV file is required.');
    }

    const extension = extname(file.originalname).toLowerCase();

    if (extension !== '.csv') {
      return buildErrorResponse(
        'Unsupported file format',
        'Only .csv files are supported in production-hardened mode.',
      );
    }

    try {
      const batchId = randomUUID();
      const storageKey = `taxonomy-imports/${batchId}${extension}`;
      await this.persistImportFile(storageKey, file.buffer);

      const batch = await this.prisma.taxonomyImportBatch.create({
        data: {
          id: batchId,
          entityType,
          status: 'UPLOADED' as any,
          fileName: file.originalname,
          fileMimeType: file.mimetype || 'application/octet-stream',
          storageKey,
          createdById,
        },
      });

      return buildSuccessResponse(this.mapImportBatch(batch));
    } catch (error) {
      logEndpointError('TaxonomyService.uploadImport', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildErrorResponse(
          'Import upload is unavailable',
          'The taxonomy import database is not ready.',
        );
      }

      throw error;
    }
  }

  async parseImport(batchId: string) {
    const batch = await this.getImportBatchRecord(batchId);
    const parsedRows = await this.readSpreadsheetRows(batch.storageKey);
    const preview = parsedRows.slice(0, 25).map((row) => row.raw);

    const updated = await this.prisma.taxonomyImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'PARSED' as any,
        rowCount: parsedRows.length,
        parsedRowsJson: parsedRows as any,
        previewJson: preview as any,
        errorsJson: [],
        duplicateSummaryJson: Prisma.JsonNull,
        validationSummaryJson: Prisma.JsonNull,
        commitSummaryJson: Prisma.JsonNull,
      },
    });

    return buildSuccessResponse({
      ...this.mapImportBatch(updated),
      preview,
    });
  }

  async validateImport(batchId: string) {
    const batch = await this.getImportBatchRecord(batchId);
    const parsedRows = await this.ensureParsedRows(batch);
    const validation = await this.validateRows(batch.entityType, parsedRows);
    const nextStatus =
      validation.errors.length > 0 ? 'FAILED' : 'READY_TO_COMMIT';

    const updated = await this.prisma.taxonomyImportBatch.update({
      where: { id: batchId },
      data: {
        status: nextStatus as any,
        rowCount: validation.summary.totalRows,
        previewJson: validation.preview as any,
        errorsJson: validation.errors as any,
        duplicateSummaryJson: validation.duplicateSummary as any,
        validationSummaryJson: validation.summary as any,
        parsedRowsJson: parsedRows as any,
      },
    });

    return buildSuccessResponse({
      ...this.mapImportBatch(updated),
      preview: validation.preview,
      errors: validation.errors,
      duplicateSummary: validation.duplicateSummary,
      validationSummary: validation.summary,
    });
  }

  async commitImport(batchId: string) {
    const batch = await this.getImportBatchRecord(batchId);
    const parsedRows = await this.ensureParsedRows(batch);
    const validation = await this.validateRows(batch.entityType, parsedRows);

    if (validation.errors.length > 0) {
      const failed = await this.prisma.taxonomyImportBatch.update({
        where: { id: batchId },
        data: {
          status: 'FAILED' as any,
          errorsJson: validation.errors as any,
          duplicateSummaryJson: validation.duplicateSummary as any,
          validationSummaryJson: validation.summary as any,
        },
      });

      return buildErrorResponse(
        'Import validation failed',
        `Resolve ${validation.errors.length} validation issue(s) before committing batch ${failed.id}.`,
      );
    }

    const commitSummary = await this.commitNormalizedRows(
      batch.entityType,
      validation.normalizedRows,
    );

    const updated = await this.prisma.taxonomyImportBatch.update({
      where: { id: batchId },
      data: {
        status: 'COMMITTED' as any,
        previewJson: validation.preview as any,
        errorsJson: [],
        duplicateSummaryJson: validation.duplicateSummary as any,
        validationSummaryJson: validation.summary as any,
        commitSummaryJson: commitSummary as any,
        committedAt: new Date(),
      },
    });

    return buildSuccessResponse({
      ...this.mapImportBatch(updated),
      commitSummary,
    });
  }

  async listImportBatches() {
    try {
      const batches = await this.prisma.taxonomyImportBatch.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(
        batches.map((batch) => this.mapImportBatch(batch)),
      );
    } catch (error) {
      logEndpointError('TaxonomyService.listImportBatches', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        return buildErrorResponse(
          'Import history is unavailable',
          'The taxonomy import database is not ready.',
        );
      }

      throw error;
    }
  }

  async getImportBatch(batchId: string) {
    try {
      const batch = await this.prisma.taxonomyImportBatch.findUnique({
        where: { id: batchId },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!batch) {
        return buildErrorResponse('Import batch not found', batchId);
      }

      return buildSuccessResponse(this.mapImportBatch(batch));
    } catch (error) {
      logEndpointError('TaxonomyService.getImportBatch', error);
      throw error;
    }
  }

  async browseEntries(entityType: string, query: string) {
    const normalizedType = this.parseImportEntityType(entityType);

    if (!normalizedType) {
      return buildErrorResponse(
        'Unsupported browser type',
        `The entity type "${entityType}" is not supported.`,
      );
    }

    const data = await this.loadEntriesByType(normalizedType, query);
    return buildSuccessResponse({
      entityType: normalizedType,
      items: data,
    });
  }

  async updateEntry(
    entityType: string,
    id: string,
    body: Record<string, unknown>,
  ) {
    const normalizedType = this.parseImportEntityType(entityType);

    if (!normalizedType) {
      return buildErrorResponse(
        'Unsupported taxonomy entry type',
        `The entity type "${entityType}" is not supported.`,
      );
    }

    const updated = await this.updateEntryByType(normalizedType, id, body);
    return buildSuccessResponse(updated);
  }

  private async getCatalog(): Promise<{
    source: 'database' | 'integrated-fallback';
    data: TaxonomyCatalog;
  }> {
    try {
      const persisted = await this.getPersistedCatalog();

      if (persisted) {
        return {
          source: 'database',
          data: persisted,
        };
      }
    } catch (error) {
      logEndpointError('TaxonomyService.getCatalog', error);
    }

    return {
      source: 'integrated-fallback',
      data: {
        sources: taxonomySourceCatalog,
        industries: taxonomyIndustries,
        categories: taxonomyCategories,
        professions: taxonomyProfessions,
        tags: taxonomyTags,
      },
    };
  }

  private async getPersistedCatalog(): Promise<TaxonomyCatalog | null> {
    if (!this.hasPersistedTaxonomyModels()) {
      return null;
    }

    const [sourceRows, industryRows, categoryRows, professionRows] =
      await Promise.all([
        this.prisma.taxonomySourceDocumentRecord.findMany({
          orderBy: { name: 'asc' },
        }),
        this.prisma.taxonomyIndustryRecord.findMany({
          orderBy: { name: 'asc' },
        }),
        this.prisma.taxonomyCategoryRecord.findMany({
          orderBy: { name: 'asc' },
        }),
        this.prisma.taxonomyProfessionRecord.findMany({
          orderBy: { name: 'asc' },
        }),
      ]);

    if (
      sourceRows.length === 0 ||
      industryRows.length === 0 ||
      categoryRows.length === 0 ||
      professionRows.length === 0
    ) {
      return null;
    }

    const sources: TaxonomySourceDocument[] = sourceRows.map((row) => ({
      id: row.key,
      name: row.name,
      source: row.source as TaxonomySourceDocument['source'],
      locale: row.locale as TaxonomySourceDocument['locale'],
      format: row.format as TaxonomySourceDocument['format'],
      note: row.note,
    }));

    const industries: TaxonomyIndustry[] = industryRows.map((row) => ({
      id: row.key,
      name: row.name,
      slug: row.slug,
      source: row.source as TaxonomyIndustry['source'],
    }));

    const categories: TaxonomyCategory[] = categoryRows.map((row) => ({
      id: row.key,
      name: row.name,
      slug: row.slug,
      industry: row.industrySlug,
      source: row.source as TaxonomyCategory['source'],
    }));

    const professions: TaxonomyProfession[] = professionRows.map((row) => ({
      id: row.key,
      name: row.name,
      slug: row.slug,
      industry: row.industrySlug,
      category: row.categorySlug,
      source: row.source as TaxonomyProfession['source'],
      labels: row.labelsJson as TaxonomyProfession['labels'],
      descriptions: row.descriptionsJson as TaxonomyProfession['descriptions'],
      tags: row.tagsJson as string[],
      skills: row.skillsJson as TaxonomySkill[],
      mappings: row.mappingsJson as TaxonomyProfession['mappings'],
      references: row.referencesJson as TaxonomyProfession['references'],
    }));

    const tags = Array.from(
      new Set(
        professions.flatMap((profession) => [
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

    return {
      sources,
      industries,
      categories,
      professions,
      tags,
    };
  }

  private hasPersistedTaxonomyModels() {
    return (
      typeof this.prisma.taxonomySourceDocumentRecord?.findMany ===
        'function' &&
      typeof this.prisma.taxonomyIndustryRecord?.findMany === 'function' &&
      typeof this.prisma.taxonomyCategoryRecord?.findMany === 'function' &&
      typeof this.prisma.taxonomyProfessionRecord?.findMany === 'function'
    );
  }

  private normalizeProfessionPayload(
    body: Record<string, unknown>,
    allowPartial = false,
  ) {
    const key =
      this.stringFromRow(body, ['key']) ||
      this.slugify(this.stringFromRow(body, ['slug', 'name']));
    const slug =
      this.stringFromRow(body, ['slug']) ||
      this.slugify(this.stringFromRow(body, ['name']));
    const name = this.stringFromRow(body, ['name']);
    const industrySlug = this.stringFromRow(body, ['industrySlug', 'industry']);
    const categorySlug = this.stringFromRow(body, ['categorySlug', 'category']);
    const source = this.stringFromRow(body, ['source']) || 'manual-import';

    if (
      !allowPartial &&
      (!key || !slug || !name || !industrySlug || !categorySlug)
    ) {
      throw new BadRequestException(
        'Profession key, slug, name, industrySlug, and categorySlug are required.',
      );
    }

    const payload: Record<string, unknown> = {};

    if (key) {
      payload.key = key;
    }
    if (slug) {
      payload.slug = slug;
    }
    if (name) {
      payload.name = name;
    }
    if (industrySlug) {
      payload.industrySlug = industrySlug;
    }
    if (categorySlug) {
      payload.categorySlug = categorySlug;
    }
    if (source) {
      payload.source = source;
    }

    payload.labelsJson = {
      en: this.stringFromRow(body, ['labelEn', 'labelsEn', 'name']) || name,
      ro:
        this.stringFromRow(body, ['labelRo', 'labelsRo']) ||
        this.stringFromRow(body, ['name']) ||
        name,
    };
    payload.descriptionsJson = {
      en: this.stringFromRow(body, ['descriptionEn']) || '',
      ro: this.stringFromRow(body, ['descriptionRo']) || '',
    };
    payload.tagsJson = this.listFromRow(body, ['tags']);
    payload.skillsJson = this.skillsFromRow(body);
    payload.mappingsJson = {
      esco: this.listFromRow(body, ['escoCodes', 'esco']),
      nace: this.listFromRow(body, ['naceCodes', 'nace']),
      uniclass: this.listFromRow(body, ['uniclassCodes', 'uniclass']),
    };
    payload.referencesJson = {
      sourceFiles: this.listFromRow(body, ['sourceFiles']),
      notes: this.stringFromRow(body, ['referenceNotes']) || '',
    };

    return payload;
  }

  private isSupportedImportType(
    value: string,
  ): value is TaxonomyImportEntityTypeValue {
    return SUPPORTED_IMPORT_TYPES.some((item) => item.value === value);
  }

  private parseImportEntityType(value: string) {
    return this.isSupportedImportType(value)
      ? (value as TaxonomyImportEntityTypeValue)
      : null;
  }

  private async getImportBatchRecord(batchId: string) {
    const batch = await this.prisma.taxonomyImportBatch.findUnique({
      where: { id: batchId },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException(`Import batch ${batchId} was not found.`);
    }

    return batch;
  }

  private async ensureParsedRows(batch: any): Promise<ParsedImportRow[]> {
    if (
      Array.isArray(batch.parsedRowsJson) &&
      batch.parsedRowsJson.length > 0
    ) {
      return batch.parsedRowsJson as ParsedImportRow[];
    }

    const parsedRows = await this.readSpreadsheetRows(batch.storageKey);
    await this.prisma.taxonomyImportBatch.update({
      where: { id: batch.id },
      data: {
        status: 'PARSED' as any,
        rowCount: parsedRows.length,
        parsedRowsJson: parsedRows as any,
        previewJson: parsedRows.slice(0, 25).map((row) => row.raw) as any,
      },
    });

    return parsedRows;
  }

  private async readSpreadsheetRows(
    storageKey: string,
  ): Promise<ParsedImportRow[]> {
    const extension = extname(storageKey).toLowerCase();
    if (extension !== '.csv') {
      throw new BadRequestException(
        'Spreadsheet imports are restricted to CSV files in production-hardened mode.',
      );
    }

    const buffer = await readFile(this.resolveImportFilePath(storageKey));
    const rows = this.parseCsvBuffer(buffer);

    return rows.map((row, index) => ({
      rowNumber: index + 2,
      raw: row,
    }));
  }

  private parseCsvBuffer(buffer: Buffer) {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const rows = this.parseDelimitedText(text);

    if (rows.length === 0) {
      return [];
    }

    const [headerRow, ...dataRows] = rows;
    const headers = headerRow.map((value) => value.trim());

    return dataRows
      .filter((row) => row.some((value) => value.trim().length > 0))
      .map<Record<string, unknown>>((row) => {
        const entry: Record<string, unknown> = {};

        headers.forEach((header, index) => {
          if (!header) {
            return;
          }

          entry[header] = row[index] ?? '';
        });

        return entry;
      });
  }

  private parseDelimitedText(input: string) {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let index = 0; index < input.length; index += 1) {
      const char = input[index];
      const nextChar = input[index + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          index += 1;
        } else {
          insideQuotes = !insideQuotes;
        }
        continue;
      }

      if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell);
        currentCell = '';
        continue;
      }

      if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (char === '\r' && nextChar === '\n') {
          index += 1;
        }
        currentRow.push(currentCell);
        rows.push(currentRow);
        currentRow = [];
        currentCell = '';
        continue;
      }

      currentCell += char;
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell);
      rows.push(currentRow);
    }

    return rows;
  }

  private async validateRows(
    entityType: TaxonomyImportEntityTypeValue,
    rows: ParsedImportRow[],
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const draftRows: Array<Omit<NormalizedImportRow, 'action'>> = [];
    const seenKeys = new Set<string>();
    const duplicateKeys = new Set<string>();

    for (const row of rows) {
      const normalized = await this.normalizeImportRow(entityType, row);

      if ('errors' in normalized) {
        issues.push(...normalized.errors);
        continue;
      }

      if (seenKeys.has(normalized.key)) {
        duplicateKeys.add(normalized.key);
      }

      seenKeys.add(normalized.key);
      draftRows.push({
        rowNumber: normalized.rowNumber,
        key: normalized.key,
        entityType: normalized.entityType,
        payload: normalized.payload,
        duplicateInFile: false,
      });
    }

    if (duplicateKeys.size > 0) {
      for (const key of duplicateKeys) {
        const duplicates = draftRows.filter((row) => row.key === key);
        duplicates.forEach((row) => {
          row.duplicateInFile = true;
          issues.push({
            rowNumber: row.rowNumber,
            key,
            code: 'DUPLICATE_IN_FILE',
            message: `Duplicate key "${key}" appears multiple times in the import file.`,
          });
        });
      }
    }

    const normalizedRows: NormalizedImportRow[] = [];

    for (const row of draftRows) {
      if (row.duplicateInFile) {
        continue;
      }

      const existing = await this.findExistingRecord(
        entityType,
        row.key,
        row.payload,
      );
      normalizedRows.push({
        ...row,
        action: existing ? 'update' : 'create',
      });
    }

    const preview = normalizedRows.slice(0, 25).map((row) => ({
      rowNumber: row.rowNumber,
      key: row.key,
      action: row.action,
      ...row.payload,
    }));

    const createCount = normalizedRows.filter(
      (row) => row.action === 'create',
    ).length;
    const updateCount = normalizedRows.filter(
      (row) => row.action === 'update',
    ).length;

    return {
      normalizedRows,
      errors: issues.sort((left, right) => left.rowNumber - right.rowNumber),
      preview,
      duplicateSummary: {
        duplicateKeysInFile: Array.from(duplicateKeys).sort(),
        createCount,
        updateCount,
      },
      summary: {
        totalRows: rows.length,
        validRows: normalizedRows.length,
        invalidRows: issues.length,
        createCount,
        updateCount,
        duplicateKeysInFile: duplicateKeys.size,
      },
    };
  }

  private async normalizeImportRow(
    entityType: TaxonomyImportEntityTypeValue,
    row: ParsedImportRow,
  ): Promise<
    | {
        rowNumber: number;
        key: string;
        entityType: TaxonomyImportEntityTypeValue;
        payload: Record<string, unknown>;
      }
    | {
        errors: ValidationIssue[];
      }
  > {
    const raw = row.raw;
    const errors: ValidationIssue[] = [];

    switch (entityType) {
      case 'ESCO':
      case 'NACE':
      case 'UNICLASS': {
        const code = this.stringFromRow(raw, ['code']);
        const label = this.stringFromRow(raw, ['label', 'name', 'title']);

        if (!code) {
          errors.push({
            rowNumber: row.rowNumber,
            key: null,
            code: 'MISSING_CODE',
            message: 'Taxonomy code is required.',
          });
        }

        if (!label) {
          errors.push({
            rowNumber: row.rowNumber,
            key: code || null,
            code: 'MISSING_LABEL',
            message: 'Taxonomy label is required.',
          });
        }

        if (errors.length > 0) {
          return { errors };
        }

        return {
          rowNumber: row.rowNumber,
          key: code,
          entityType,
          payload: {
            code,
            label,
            labelEn: this.nullableStringFromRow(raw, ['labelEn', 'nameEn']),
            parentCode: this.nullableStringFromRow(raw, ['parentCode']),
            type: entityType,
          },
        };
      }
      case 'COUNTRIES': {
        const code = this.stringFromRow(raw, [
          'code',
          'countryCode',
        ])?.toUpperCase();
        const name = this.stringFromRow(raw, ['name', 'countryName']);
        const currency = this.stringFromRow(raw, [
          'currency',
          'currencyCode',
        ])?.toUpperCase();
        const vatRate = this.numberFromRow(raw, ['vatRate', 'vat']);

        if (!code || !name) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: code || null,
                code: 'MISSING_COUNTRY_FIELDS',
                message: 'Country code and name are required.',
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key: code,
          entityType,
          payload: {
            code,
            name,
            currency: currency || 'EUR',
            vatRate: typeof vatRate === 'number' ? vatRate : 0,
          },
        };
      }
      case 'REGIONS': {
        const countryCode = this.stringFromRow(raw, [
          'countryCode',
        ])?.toUpperCase();
        const name = this.stringFromRow(raw, ['name', 'regionName']);

        if (!countryCode || !name) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: null,
                code: 'MISSING_REGION_FIELDS',
                message: 'Region name and countryCode are required.',
              },
            ],
          };
        }

        const country = await this.prisma.country.findUnique({
          where: { code: countryCode },
        });

        if (!country) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: `${countryCode}:${name}`,
                code: 'UNKNOWN_COUNTRY',
                message: `Country "${countryCode}" does not exist for region import.`,
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key: `${countryCode}:${name.toLowerCase()}`,
          entityType,
          payload: {
            name,
            countryId: country.id,
            countryCode,
          },
        };
      }
      case 'CITIES': {
        const countryCode = this.stringFromRow(raw, [
          'countryCode',
        ])?.toUpperCase();
        const regionName = this.stringFromRow(raw, ['regionName', 'region']);
        const name = this.stringFromRow(raw, ['name', 'cityName']);

        if (!countryCode || !regionName || !name) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: null,
                code: 'MISSING_CITY_FIELDS',
                message: 'City name, regionName, and countryCode are required.',
              },
            ],
          };
        }

        const region = await this.prisma.region.findFirst({
          where: {
            name: regionName,
            country: {
              code: countryCode,
            },
          },
          include: {
            country: true,
          },
        });

        if (!region) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: `${countryCode}:${regionName}:${name}`,
                code: 'UNKNOWN_REGION',
                message: `Region "${regionName}" in country "${countryCode}" does not exist for city import.`,
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key: `${countryCode}:${regionName.toLowerCase()}:${name.toLowerCase()}`,
          entityType,
          payload: {
            name,
            regionId: region.id,
            regionName,
            countryCode,
          },
        };
      }
      case 'VAT': {
        const countryCode = this.stringFromRow(raw, [
          'countryCode',
        ])?.toUpperCase();
        const vatRate = this.numberFromRow(raw, ['vatRate', 'vat']);

        if (!countryCode || typeof vatRate !== 'number') {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: countryCode || null,
                code: 'MISSING_VAT_FIELDS',
                message:
                  'countryCode and vatRate are required for VAT imports.',
              },
            ],
          };
        }

        const country = await this.prisma.country.findUnique({
          where: { code: countryCode },
        });

        if (!country) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: countryCode,
                code: 'UNKNOWN_COUNTRY',
                message: `Country "${countryCode}" does not exist for VAT import.`,
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key: countryCode,
          entityType,
          payload: {
            countryCode,
            vatRate,
          },
        };
      }
      case 'CURRENCIES': {
        const code = this.stringFromRow(raw, [
          'code',
          'currencyCode',
        ])?.toUpperCase();
        const name = this.stringFromRow(raw, ['name', 'currencyName']);
        const symbol = this.stringFromRow(raw, ['symbol']) || code || '';

        if (!code || !name) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: code || null,
                code: 'MISSING_CURRENCY_FIELDS',
                message: 'Currency code and name are required.',
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key: code,
          entityType,
          payload: {
            code,
            name,
            symbol,
          },
        };
      }
      case 'PROFESSIONS': {
        try {
          const payload = this.normalizeProfessionPayload(raw);
          return {
            rowNumber: row.rowNumber,
            key: String(payload.key),
            entityType,
            payload,
          };
        } catch (error) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: null,
                code: 'INVALID_PROFESSION',
                message:
                  error instanceof Error
                    ? error.message
                    : 'Profession row is invalid.',
              },
            ],
          };
        }
      }
      case 'CERTIFICATIONS': {
        const code = this.stringFromRow(raw, ['code']);
        const name = this.stringFromRow(raw, ['name', 'label']);
        const slug = this.stringFromRow(raw, ['slug']) || this.slugify(name);

        if (!code || !name || !slug) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: code || null,
                code: 'MISSING_CERTIFICATION_FIELDS',
                message: 'Certification code, name, and slug are required.',
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key: code,
          entityType,
          payload: {
            code,
            slug,
            name,
            issuer: this.nullableStringFromRow(raw, ['issuer']),
            category: this.nullableStringFromRow(raw, ['category']),
            description: this.nullableStringFromRow(raw, ['description']),
            source: this.stringFromRow(raw, ['source']) || 'manual-import',
          },
        };
      }
      case 'INDUSTRIES': {
        const name = this.stringFromRow(raw, ['name']);
        const slug = this.stringFromRow(raw, ['slug']) || this.slugify(name);
        const key = this.stringFromRow(raw, ['key']) || slug;

        if (!name || !slug || !key) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: key || null,
                code: 'MISSING_INDUSTRY_FIELDS',
                message: 'Industry key, slug, and name are required.',
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key,
          entityType,
          payload: {
            key,
            slug,
            name,
            source: this.stringFromRow(raw, ['source']) || 'manual-import',
          },
        };
      }
      case 'PROJECT_CATEGORIES': {
        const name = this.stringFromRow(raw, ['name']);
        const slug = this.stringFromRow(raw, ['slug']) || this.slugify(name);
        const key = this.stringFromRow(raw, ['key']) || slug;
        const industrySlug = this.stringFromRow(raw, [
          'industrySlug',
          'industry',
        ]);

        if (!name || !slug || !key || !industrySlug) {
          return {
            errors: [
              {
                rowNumber: row.rowNumber,
                key: key || null,
                code: 'MISSING_CATEGORY_FIELDS',
                message:
                  'Project category key, slug, name, and industrySlug are required.',
              },
            ],
          };
        }

        return {
          rowNumber: row.rowNumber,
          key,
          entityType,
          payload: {
            key,
            slug,
            name,
            industrySlug,
            source: this.stringFromRow(raw, ['source']) || 'manual-import',
          },
        };
      }
      default:
        return {
          errors: [
            {
              rowNumber: row.rowNumber,
              key: null,
              code: 'UNSUPPORTED_TYPE',
              message: `Import type "${entityType}" is not supported.`,
            },
          ],
        };
    }
  }

  private async findExistingRecord(
    entityType: TaxonomyImportEntityTypeValue,
    key: string,
    payload: Record<string, unknown>,
  ) {
    switch (entityType) {
      case 'ESCO':
      case 'NACE':
      case 'UNICLASS':
        return this.prisma.taxonomy.findUnique({
          where: {
            code_type: {
              code: String(payload.code),
              type: entityType as TaxonomyType,
            },
          },
        });
      case 'COUNTRIES':
      case 'VAT':
        return this.prisma.country.findUnique({
          where: { code: String(payload.countryCode ?? payload.code) },
        });
      case 'REGIONS':
        return this.prisma.region.findFirst({
          where: {
            name: String(payload.name),
            countryId: String(payload.countryId),
          },
        });
      case 'CITIES':
        return this.prisma.city.findFirst({
          where: {
            name: String(payload.name),
            regionId: String(payload.regionId),
          },
        });
      case 'CURRENCIES':
        return this.prisma.currency.findUnique({
          where: { code: String(payload.code) },
        });
      case 'PROFESSIONS':
        return this.prisma.taxonomyProfessionRecord.findUnique({
          where: { key: String(payload.key) },
        });
      case 'CERTIFICATIONS':
        return this.prisma.taxonomyCertificationRecord.findUnique({
          where: { code: String(payload.code) },
        });
      case 'INDUSTRIES':
        return this.prisma.taxonomyIndustryRecord.findUnique({
          where: { key: String(payload.key) },
        });
      case 'PROJECT_CATEGORIES':
        return this.prisma.taxonomyCategoryRecord.findUnique({
          where: { key: String(payload.key) },
        });
      default:
        return key ? {} : null;
    }
  }

  private async commitNormalizedRows(
    entityType: TaxonomyImportEntityTypeValue,
    rows: NormalizedImportRow[],
  ) {
    let created = 0;
    let updated = 0;

    for (const row of rows) {
      if (
        entityType === 'ESCO' ||
        entityType === 'NACE' ||
        entityType === 'UNICLASS'
      ) {
        const parentCode = this.nullableString(row.payload.parentCode);
        let parentId: string | null = null;

        if (parentCode) {
          const parent = await this.prisma.taxonomy.findUnique({
            where: {
              code_type: {
                code: parentCode,
                type: entityType as TaxonomyType,
              },
            },
          });
          parentId = parent?.id ?? null;
        }

        await this.prisma.taxonomy.upsert({
          where: {
            code_type: {
              code: String(row.payload.code),
              type: entityType as TaxonomyType,
            },
          },
          update: {
            label: String(row.payload.label),
            labelEn: this.nullableString(row.payload.labelEn),
            parentId,
          },
          create: {
            code: String(row.payload.code),
            type: entityType as TaxonomyType,
            label: String(row.payload.label),
            labelEn: this.nullableString(row.payload.labelEn),
            parentId,
          },
        });
      } else if (entityType === 'COUNTRIES') {
        await this.prisma.country.upsert({
          where: { code: String(row.payload.code) },
          update: {
            name: String(row.payload.name),
            currency: String(row.payload.currency),
            vatRate: Number(row.payload.vatRate),
          },
          create: {
            name: String(row.payload.name),
            code: String(row.payload.code),
            currency: String(row.payload.currency),
            vatRate: Number(row.payload.vatRate),
          },
        });
      } else if (entityType === 'REGIONS') {
        const existing = await this.prisma.region.findFirst({
          where: {
            name: String(row.payload.name),
            countryId: String(row.payload.countryId),
          },
        });

        if (existing) {
          await this.prisma.region.update({
            where: { id: existing.id },
            data: {
              name: String(row.payload.name),
              countryId: String(row.payload.countryId),
            },
          });
        } else {
          await this.prisma.region.create({
            data: {
              name: String(row.payload.name),
              countryId: String(row.payload.countryId),
            },
          });
        }
      } else if (entityType === 'CITIES') {
        const existing = await this.prisma.city.findFirst({
          where: {
            name: String(row.payload.name),
            regionId: String(row.payload.regionId),
          },
        });

        if (existing) {
          await this.prisma.city.update({
            where: { id: existing.id },
            data: {
              name: String(row.payload.name),
              regionId: String(row.payload.regionId),
            },
          });
        } else {
          await this.prisma.city.create({
            data: {
              name: String(row.payload.name),
              regionId: String(row.payload.regionId),
            },
          });
        }
      } else if (entityType === 'VAT') {
        await this.prisma.country.update({
          where: { code: String(row.payload.countryCode) },
          data: {
            vatRate: Number(row.payload.vatRate),
          },
        });
      } else if (entityType === 'CURRENCIES') {
        await this.prisma.currency.upsert({
          where: { code: String(row.payload.code) },
          update: {
            name: String(row.payload.name),
            symbol: String(row.payload.symbol),
          },
          create: {
            code: String(row.payload.code),
            name: String(row.payload.name),
            symbol: String(row.payload.symbol),
          },
        });
      } else if (entityType === 'PROFESSIONS') {
        await this.prisma.taxonomyProfessionRecord.upsert({
          where: { key: String(row.payload.key) },
          update: {
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            industrySlug: String(row.payload.industrySlug),
            categorySlug: String(row.payload.categorySlug),
            source: String(row.payload.source),
            labelsJson: row.payload.labelsJson as any,
            descriptionsJson: row.payload.descriptionsJson as any,
            tagsJson: row.payload.tagsJson as any,
            skillsJson: row.payload.skillsJson as any,
            mappingsJson: row.payload.mappingsJson as any,
            referencesJson: row.payload.referencesJson as any,
          },
          create: {
            key: String(row.payload.key),
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            industrySlug: String(row.payload.industrySlug),
            categorySlug: String(row.payload.categorySlug),
            source: String(row.payload.source),
            labelsJson: row.payload.labelsJson as any,
            descriptionsJson: row.payload.descriptionsJson as any,
            tagsJson: row.payload.tagsJson as any,
            skillsJson: row.payload.skillsJson as any,
            mappingsJson: row.payload.mappingsJson as any,
            referencesJson: row.payload.referencesJson as any,
          },
        });
      } else if (entityType === 'CERTIFICATIONS') {
        await this.prisma.taxonomyCertificationRecord.upsert({
          where: { code: String(row.payload.code) },
          update: {
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            issuer: this.nullableString(row.payload.issuer),
            category: this.nullableString(row.payload.category),
            description: this.nullableString(row.payload.description),
            source: String(row.payload.source),
          },
          create: {
            code: String(row.payload.code),
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            issuer: this.nullableString(row.payload.issuer),
            category: this.nullableString(row.payload.category),
            description: this.nullableString(row.payload.description),
            source: String(row.payload.source),
          },
        });
      } else if (entityType === 'INDUSTRIES') {
        await this.prisma.taxonomyIndustryRecord.upsert({
          where: { key: String(row.payload.key) },
          update: {
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            source: String(row.payload.source),
          },
          create: {
            key: String(row.payload.key),
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            source: String(row.payload.source),
          },
        });
      } else if (entityType === 'PROJECT_CATEGORIES') {
        await this.prisma.taxonomyCategoryRecord.upsert({
          where: { key: String(row.payload.key) },
          update: {
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            industrySlug: String(row.payload.industrySlug),
            source: String(row.payload.source),
          },
          create: {
            key: String(row.payload.key),
            slug: String(row.payload.slug),
            name: String(row.payload.name),
            industrySlug: String(row.payload.industrySlug),
            source: String(row.payload.source),
          },
        });
      }

      if (row.action === 'create') {
        created += 1;
      } else {
        updated += 1;
      }
    }

    return {
      created,
      updated,
      totalCommitted: rows.length,
    };
  }

  private async loadEntriesByType(
    entityType: TaxonomyImportEntityTypeValue,
    query: string,
  ) {
    const normalizedQuery = query.trim();

    switch (entityType) {
      case 'ESCO':
      case 'NACE':
      case 'UNICLASS':
        return this.prisma.taxonomy.findMany({
          where: {
            type: entityType as TaxonomyType,
            ...(normalizedQuery
              ? {
                  OR: [
                    {
                      code: { contains: normalizedQuery, mode: 'insensitive' },
                    },
                    {
                      label: { contains: normalizedQuery, mode: 'insensitive' },
                    },
                    {
                      labelEn: {
                        contains: normalizedQuery,
                        mode: 'insensitive',
                      },
                    },
                  ],
                }
              : {}),
          },
          orderBy: [{ label: 'asc' }],
          take: 200,
        });
      case 'COUNTRIES':
      case 'VAT':
        return this.prisma.country.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { code: { contains: normalizedQuery, mode: 'insensitive' } },
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                ],
              }
            : undefined,
          include: {
            regions: {
              include: {
                cities: true,
              },
            },
          },
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      case 'REGIONS':
        return this.prisma.region.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  {
                    country: {
                      code: { contains: normalizedQuery, mode: 'insensitive' },
                    },
                  },
                ],
              }
            : undefined,
          include: {
            country: true,
            cities: true,
          },
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      case 'CITIES':
        return this.prisma.city.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  {
                    region: {
                      name: { contains: normalizedQuery, mode: 'insensitive' },
                    },
                  },
                ],
              }
            : undefined,
          include: {
            region: {
              include: {
                country: true,
              },
            },
          },
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      case 'CURRENCIES':
        return this.prisma.currency.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { code: { contains: normalizedQuery, mode: 'insensitive' } },
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  {
                    symbol: { contains: normalizedQuery, mode: 'insensitive' },
                  },
                ],
              }
            : undefined,
          orderBy: [{ code: 'asc' }],
          take: 200,
        });
      case 'PROFESSIONS':
        return this.prisma.taxonomyProfessionRecord.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { key: { contains: normalizedQuery, mode: 'insensitive' } },
                  { slug: { contains: normalizedQuery, mode: 'insensitive' } },
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  {
                    industrySlug: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                  {
                    categorySlug: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : undefined,
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      case 'CERTIFICATIONS':
        return this.prisma.taxonomyCertificationRecord.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { code: { contains: normalizedQuery, mode: 'insensitive' } },
                  { slug: { contains: normalizedQuery, mode: 'insensitive' } },
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  {
                    category: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : undefined,
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      case 'INDUSTRIES':
        return this.prisma.taxonomyIndustryRecord.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { key: { contains: normalizedQuery, mode: 'insensitive' } },
                  { slug: { contains: normalizedQuery, mode: 'insensitive' } },
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                ],
              }
            : undefined,
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      case 'PROJECT_CATEGORIES':
        return this.prisma.taxonomyCategoryRecord.findMany({
          where: normalizedQuery
            ? {
                OR: [
                  { key: { contains: normalizedQuery, mode: 'insensitive' } },
                  { slug: { contains: normalizedQuery, mode: 'insensitive' } },
                  { name: { contains: normalizedQuery, mode: 'insensitive' } },
                  {
                    industrySlug: {
                      contains: normalizedQuery,
                      mode: 'insensitive',
                    },
                  },
                ],
              }
            : undefined,
          orderBy: [{ name: 'asc' }],
          take: 200,
        });
      default:
        return [];
    }
  }

  private async updateEntryByType(
    entityType: TaxonomyImportEntityTypeValue,
    id: string,
    body: Record<string, unknown>,
  ) {
    switch (entityType) {
      case 'ESCO':
      case 'NACE':
      case 'UNICLASS':
        return this.prisma.taxonomy.update({
          where: { id },
          data: {
            code: this.stringFromRow(body, ['code']) || undefined,
            label: this.stringFromRow(body, ['label']) || undefined,
            labelEn: this.nullableStringFromRow(body, ['labelEn']),
          },
        });
      case 'COUNTRIES':
      case 'VAT':
        const vatRate = this.numberFromRow(body, ['vatRate']);
        return this.prisma.country.update({
          where: { id },
          data: {
            code: this.stringFromRow(body, ['code']) || undefined,
            name: this.stringFromRow(body, ['name']) || undefined,
            currency: this.stringFromRow(body, ['currency']) || undefined,
            vatRate: typeof vatRate === 'number' ? vatRate : undefined,
          },
        });
      case 'REGIONS':
        return this.prisma.region.update({
          where: { id },
          data: {
            name: this.stringFromRow(body, ['name']) || undefined,
          },
        });
      case 'CITIES':
        return this.prisma.city.update({
          where: { id },
          data: {
            name: this.stringFromRow(body, ['name']) || undefined,
          },
        });
      case 'CURRENCIES':
        return this.prisma.currency.update({
          where: { id },
          data: {
            code: this.stringFromRow(body, ['code']) || undefined,
            name: this.stringFromRow(body, ['name']) || undefined,
            symbol: this.stringFromRow(body, ['symbol']) || undefined,
          },
        });
      case 'PROFESSIONS':
        return this.prisma.taxonomyProfessionRecord.update({
          where: { id },
          data: this.normalizeProfessionPayload(body, true),
        });
      case 'CERTIFICATIONS':
        return this.prisma.taxonomyCertificationRecord.update({
          where: { id },
          data: {
            code: this.stringFromRow(body, ['code']) || undefined,
            slug:
              this.stringFromRow(body, ['slug']) ||
              this.slugify(this.stringFromRow(body, ['name'])),
            name: this.stringFromRow(body, ['name']) || undefined,
            issuer: this.nullableStringFromRow(body, ['issuer']),
            category: this.nullableStringFromRow(body, ['category']),
            description: this.nullableStringFromRow(body, ['description']),
            source: this.stringFromRow(body, ['source']) || undefined,
          },
        });
      case 'INDUSTRIES':
        return this.prisma.taxonomyIndustryRecord.update({
          where: { id },
          data: {
            key:
              this.stringFromRow(body, ['key']) ||
              this.slugify(this.stringFromRow(body, ['slug', 'name'])),
            slug:
              this.stringFromRow(body, ['slug']) ||
              this.slugify(this.stringFromRow(body, ['name'])),
            name: this.stringFromRow(body, ['name']) || undefined,
            source: this.stringFromRow(body, ['source']) || undefined,
          },
        });
      case 'PROJECT_CATEGORIES':
        return this.prisma.taxonomyCategoryRecord.update({
          where: { id },
          data: {
            key:
              this.stringFromRow(body, ['key']) ||
              this.slugify(this.stringFromRow(body, ['slug', 'name'])),
            slug:
              this.stringFromRow(body, ['slug']) ||
              this.slugify(this.stringFromRow(body, ['name'])),
            name: this.stringFromRow(body, ['name']) || undefined,
            industrySlug:
              this.stringFromRow(body, ['industrySlug']) || undefined,
            source: this.stringFromRow(body, ['source']) || undefined,
          },
        });
      default:
        throw new BadRequestException(
          `Unsupported entry type "${entityType}".`,
        );
    }
  }

  private mapImportBatch(batch: any) {
    return {
      id: batch.id,
      entityType: batch.entityType,
      status: batch.status,
      fileName: batch.fileName,
      fileMimeType: batch.fileMimeType,
      storageKey: batch.storageKey,
      rowCount: batch.rowCount,
      preview: Array.isArray(batch.previewJson) ? batch.previewJson : [],
      errors: Array.isArray(batch.errorsJson) ? batch.errorsJson : [],
      duplicateSummary:
        batch.duplicateSummaryJson &&
        typeof batch.duplicateSummaryJson === 'object'
          ? batch.duplicateSummaryJson
          : null,
      validationSummary:
        batch.validationSummaryJson &&
        typeof batch.validationSummaryJson === 'object'
          ? batch.validationSummaryJson
          : null,
      commitSummary:
        batch.commitSummaryJson && typeof batch.commitSummaryJson === 'object'
          ? batch.commitSummaryJson
          : null,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      committedAt: batch.committedAt,
      createdBy: batch.createdBy ?? null,
    };
  }

  private async persistImportFile(storageKey: string, buffer: Buffer) {
    const absolutePath = this.resolveImportFilePath(storageKey);
    await mkdir(join(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, buffer);
  }

  private resolveImportFilePath(storageKey: string) {
    return join(process.cwd(), 'uploads', storageKey);
  }

  private stringFromRow(row: Record<string, unknown>, candidates: string[]) {
    for (const candidate of candidates) {
      const value = row[candidate];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }
    }

    return '';
  }

  private nullableStringFromRow(
    row: Record<string, unknown>,
    candidates: string[],
  ) {
    const value = this.stringFromRow(row, candidates);
    return value || null;
  }

  private numberFromRow(row: Record<string, unknown>, candidates: string[]) {
    for (const candidate of candidates) {
      const value = row[candidate];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return null;
  }

  private nullableString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }

  private listFromRow(row: Record<string, unknown>, candidates: string[]) {
    for (const candidate of candidates) {
      const value = row[candidate];

      if (Array.isArray(value)) {
        return value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean);
      }

      if (typeof value === 'string' && value.trim()) {
        return value
          .split(/[,\n;]/)
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return [];
  }

  private skillsFromRow(row: Record<string, unknown>) {
    return this.listFromRow(row, ['skills']).map((skillName) => ({
      name: skillName,
      level: null,
    }));
  }

  private slugify(value: string) {
    return (
      value
        .normalize('NFKD')
        .replace(/[^\w\s-]/g, '')
        .trim()
        .toLowerCase()
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `entry-${Date.now()}`
    );
  }
}

export type { UploadedImportFile };
