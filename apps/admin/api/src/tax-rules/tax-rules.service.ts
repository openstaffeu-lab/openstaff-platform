import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxRuleDto } from './dto/create-tax-rule.dto';
import { UpdateTaxRuleDto } from './dto/update-tax-rule.dto';

@Injectable()
export class TaxRulesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const taxRules = await this.prisma.taxRule.findMany({
      include: {
        country: true,
      },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });

    return taxRules.map((taxRule) => this.toResponse(taxRule));
  }

  async create(body: CreateTaxRuleDto) {
    const taxRule = await this.prisma.taxRule.create({
      data: {
        countryId: body.countryId,
        name: body.name.trim(),
        code: body.code.trim(),
        appliesTo: body.appliesTo,
        vatRate: body.vatRate,
        withholdingRate: body.withholdingRate ?? 0,
        socialContributionRate: body.socialContributionRate ?? 0,
        employerContributionRate: body.employerContributionRate ?? 0,
        currencyCode: body.currencyCode.trim(),
        notes: body.notes?.trim() ?? null,
        isActive: body.isActive ?? true,
      },
      include: {
        country: true,
      },
    });

    return this.toResponse(taxRule);
  }

  async update(id: string, body: UpdateTaxRuleDto) {
    const existingRule = await this.prisma.taxRule.findUnique({
      where: {
        id,
      },
    });

    if (!existingRule) {
      throw new NotFoundException('Tax rule not found');
    }

    const taxRule = await this.prisma.taxRule.update({
      where: {
        id,
      },
      data: {
        countryId: body.countryId ?? undefined,
        name: body.name?.trim(),
        code: body.code?.trim(),
        appliesTo: body.appliesTo ?? undefined,
        vatRate: body.vatRate ?? undefined,
        withholdingRate: body.withholdingRate ?? undefined,
        socialContributionRate: body.socialContributionRate ?? undefined,
        employerContributionRate: body.employerContributionRate ?? undefined,
        currencyCode: body.currencyCode?.trim(),
        notes:
          body.notes !== undefined ? (body.notes?.trim() ?? null) : undefined,
        isActive: body.isActive ?? undefined,
      },
      include: {
        country: true,
      },
    });

    return this.toResponse(taxRule);
  }

  private toResponse(taxRule: any) {
    return {
      id: taxRule.id,
      countryId: taxRule.countryId,
      name: taxRule.name,
      code: taxRule.code,
      appliesTo: taxRule.appliesTo,
      vatRate: taxRule.vatRate,
      withholdingRate: taxRule.withholdingRate,
      socialContributionRate: taxRule.socialContributionRate,
      employerContributionRate: taxRule.employerContributionRate,
      currencyCode: taxRule.currencyCode,
      notes: taxRule.notes,
      isActive: taxRule.isActive,
      createdAt: taxRule.createdAt,
      updatedAt: taxRule.updatedAt,
      country: taxRule.country
        ? {
            id: taxRule.country.id,
            code: taxRule.country.code,
            name: taxRule.country.name,
            currency: taxRule.country.currency,
            vatRate: taxRule.country.vatRate,
          }
        : null,
    };
  }
}
