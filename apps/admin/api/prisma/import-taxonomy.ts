import { PrismaClient } from '@prisma/client';
import {
  taxonomyCategories,
  taxonomyIndustries,
  taxonomyProfessions,
  taxonomySourceCatalog,
} from '../src/taxonomy/taxonomy.data';

const prisma = new PrismaClient();

async function main() {
  for (const sourceDocument of taxonomySourceCatalog) {
    await prisma.taxonomySourceDocumentRecord.upsert({
      where: { key: sourceDocument.id },
      update: {
        name: sourceDocument.name,
        source: sourceDocument.source,
        locale: sourceDocument.locale,
        format: sourceDocument.format,
        note: sourceDocument.note,
      },
      create: {
        key: sourceDocument.id,
        name: sourceDocument.name,
        source: sourceDocument.source,
        locale: sourceDocument.locale,
        format: sourceDocument.format,
        note: sourceDocument.note,
      },
    });
  }

  for (const industry of taxonomyIndustries) {
    await prisma.taxonomyIndustryRecord.upsert({
      where: { key: industry.id },
      update: {
        slug: industry.slug,
        name: industry.name,
        source: industry.source,
      },
      create: {
        key: industry.id,
        slug: industry.slug,
        name: industry.name,
        source: industry.source,
      },
    });
  }

  for (const category of taxonomyCategories) {
    await prisma.taxonomyCategoryRecord.upsert({
      where: { key: category.id },
      update: {
        slug: category.slug,
        name: category.name,
        industrySlug: category.industry,
        source: category.source,
      },
      create: {
        key: category.id,
        slug: category.slug,
        name: category.name,
        industrySlug: category.industry,
        source: category.source,
      },
    });
  }

  for (const profession of taxonomyProfessions) {
    await prisma.taxonomyProfessionRecord.upsert({
      where: { key: profession.id },
      update: {
        slug: profession.slug,
        name: profession.name,
        industrySlug: profession.industry,
        categorySlug: profession.category,
        source: profession.source,
        labelsJson: profession.labels,
        descriptionsJson: profession.descriptions,
        tagsJson: profession.tags,
        skillsJson: profession.skills,
        mappingsJson: profession.mappings,
        referencesJson: profession.references,
      },
      create: {
        key: profession.id,
        slug: profession.slug,
        name: profession.name,
        industrySlug: profession.industry,
        categorySlug: profession.category,
        source: profession.source,
        labelsJson: profession.labels,
        descriptionsJson: profession.descriptions,
        tagsJson: profession.tags,
        skillsJson: profession.skills,
        mappingsJson: profession.mappings,
        referencesJson: profession.references,
      },
    });
  }

  console.log('Taxonomy import completed successfully');
}

main()
  .catch((error) => {
    console.error('[taxonomy import]', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
