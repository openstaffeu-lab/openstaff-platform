import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaxonomyType } from '@prisma/client';
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
      catalog.data.industries.find((item) => item.slug === industrySlug) ?? null;
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

  createProfession(body: Record<string, unknown>) {
    return {
      status: 'ok',
      source: 'placeholder',
      persistence: 'placeholder',
      message:
        'Taxonomy write endpoint is protected but still running in placeholder mode until persistence is implemented.',
      data: body,
    };
  }

  updateProfession(id: string, body: Record<string, unknown>) {
    return {
      status: 'ok',
      source: 'placeholder',
      persistence: 'placeholder',
      message:
        'Taxonomy update endpoint is protected but still running in placeholder mode until persistence is implemented.',
      data: {
        id,
        ...body,
      },
    };
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
      console.error('[TaxonomyService.searchByType]', error);
      return [];
    }
  }

  async importBulk(entries: Array<Record<string, unknown>>) {
    let imported = 0;

    for (const entry of entries) {
      const code = typeof entry.code === 'string' ? entry.code : '';
      const type = entry.type as TaxonomyType | undefined;
      const label = typeof entry.label === 'string' ? entry.label : '';

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
          labelEn: typeof entry.labelEn === 'string' ? entry.labelEn : null,
          parentId: typeof entry.parentId === 'string' ? entry.parentId : null,
        },
        create: {
          code,
          type,
          label,
          labelEn: typeof entry.labelEn === 'string' ? entry.labelEn : null,
          parentId: typeof entry.parentId === 'string' ? entry.parentId : null,
        },
      });

      imported += 1;
    }

    return {
      imported,
      status: 'ok',
    };
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
      console.error('[TaxonomyService.getCatalog]', error);
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
      typeof this.prisma.taxonomySourceDocumentRecord?.findMany === 'function' &&
      typeof this.prisma.taxonomyIndustryRecord?.findMany === 'function' &&
      typeof this.prisma.taxonomyCategoryRecord?.findMany === 'function' &&
      typeof this.prisma.taxonomyProfessionRecord?.findMany === 'function'
    );
  }
}
