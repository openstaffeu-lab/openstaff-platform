import { Injectable } from '@nestjs/common';
import { ProjectEngagementModel } from '@prisma/client';

type FinancialContext = {
  contractType: ProjectEngagementModel;
  baseAmountCents: number;
  country: {
    id: string | null;
    code: string | null;
    name: string | null;
    currency: string | null;
    vatRate: number;
  } | null;
  taxRule: {
    id: string;
    name: string;
    code: string;
    appliesTo: ProjectEngagementModel;
    vatRate: number;
    withholdingRate: number;
    socialContributionRate: number;
    employerContributionRate: number;
    currencyCode: string;
    notes: string | null;
  } | null;
  proposalCurrencyCode: string | null;
};

@Injectable()
export class FinancialRulesService {
  calculate(context: FinancialContext) {
    const platformFeeRate = 3;
    const baseAmountCents = context.baseAmountCents;
    const vatRate = context.taxRule?.vatRate ?? context.country?.vatRate ?? 0;
    const withholdingRate = context.taxRule?.withholdingRate ?? 0;
    const socialContributionRate = context.taxRule?.socialContributionRate ?? 0;
    const employerContributionRate = context.taxRule?.employerContributionRate ?? 0;
    const currencyCode =
      context.taxRule?.currencyCode ??
      context.proposalCurrencyCode ??
      context.country?.currency ??
      'EUR';

    const b2b = this.calculateB2B(baseAmountCents, vatRate, platformFeeRate);
    const b2c = this.calculateB2C(
      baseAmountCents,
      withholdingRate,
      socialContributionRate,
      employerContributionRate,
      platformFeeRate,
    );

    if (context.contractType === ProjectEngagementModel.B2B) {
      return {
        contractType: context.contractType,
        currencyCode,
        grossAmountCents: b2b.grossAmountCents,
        vatAmountCents: b2b.vatAmountCents,
        netAmountCents: b2b.netAmountCents,
        platformFeeCents: b2b.platformFeeCents,
        escrowRequiredAmountCents: b2b.escrowRequiredAmountCents,
        workerGrossPayCents: null,
        workerNetPayCents: null,
        employerCostCents: null,
        calculationJson: {
          mode: 'B2B',
          assumptionVersion: 'phase13-v1',
          country: context.country,
          taxRule: context.taxRule,
          platformFeeRate,
          assumptions: {
            baseAmountSource: 'proposal.priceCents',
            netDefinition: 'grossAmount + vatAmount',
            escrowDefinition: 'netAmount + platformFee',
          },
          b2b,
        },
      };
    }

    if (context.contractType === ProjectEngagementModel.B2C) {
      return {
        contractType: context.contractType,
        currencyCode,
        grossAmountCents: b2c.workerGrossPayCents,
        vatAmountCents: 0,
        netAmountCents: b2c.workerNetPayCents,
        platformFeeCents: b2c.platformFeeCents,
        escrowRequiredAmountCents: b2c.escrowRequiredAmountCents,
        workerGrossPayCents: b2c.workerGrossPayCents,
        workerNetPayCents: b2c.workerNetPayCents,
        employerCostCents: b2c.employerCostCents,
        calculationJson: {
          mode: 'B2C',
          assumptionVersion: 'phase13-v1',
          country: context.country,
          taxRule: context.taxRule,
          platformFeeRate,
          assumptions: {
            baseAmountSource: 'proposal.priceCents',
            benefitsPlaceholderRate: b2c.benefitsPlaceholderRate,
            workerNetDefinition: 'workerGross - withholding - socialContribution',
            escrowDefinition: 'employerCost + platformFee',
          },
          b2c,
        },
      };
    }

    return {
      contractType: context.contractType,
      currencyCode,
      grossAmountCents: b2b.grossAmountCents,
      vatAmountCents: b2b.vatAmountCents,
      netAmountCents: b2b.netAmountCents,
      platformFeeCents: Math.max(b2b.platformFeeCents, b2c.platformFeeCents),
      escrowRequiredAmountCents: Math.max(
        b2b.escrowRequiredAmountCents,
        b2c.escrowRequiredAmountCents,
      ),
      workerGrossPayCents: b2c.workerGrossPayCents,
      workerNetPayCents: b2c.workerNetPayCents,
      employerCostCents: b2c.employerCostCents,
      calculationJson: {
        mode: 'MIXED',
        assumptionVersion: 'phase13-v1',
        country: context.country,
        taxRule: context.taxRule,
        platformFeeRate,
        assumptions: {
          baseAmountSource: 'proposal.priceCents',
          mixedTopLevel: 'Top-level commercial totals follow B2B assumptions while worker pay follows B2C assumptions.',
        },
        mixedAssumptions: {
          b2b,
          b2c,
        },
      },
    };
  }

  private calculateB2B(baseAmountCents: number, vatRate: number, platformFeeRate: number) {
    const vatAmountCents = this.multiplyRate(baseAmountCents, vatRate);
    const platformFeeCents = this.multiplyRate(baseAmountCents, platformFeeRate);
    const netAmountCents = baseAmountCents + vatAmountCents;
    const escrowRequiredAmountCents = netAmountCents + platformFeeCents;

    return {
      grossAmountCents: baseAmountCents,
      vatRate,
      vatAmountCents,
      netAmountCents,
      platformFeeRate,
      platformFeeCents,
      escrowRequiredAmountCents,
    };
  }

  private calculateB2C(
    baseAmountCents: number,
    withholdingRate: number,
    socialContributionRate: number,
    employerContributionRate: number,
    platformFeeRate: number,
  ) {
    const benefitsPlaceholderRate = 5;
    const withholdingAmountCents = this.multiplyRate(baseAmountCents, withholdingRate);
    const socialContributionAmountCents = this.multiplyRate(
      baseAmountCents,
      socialContributionRate,
    );
    const employerContributionAmountCents = this.multiplyRate(
      baseAmountCents,
      employerContributionRate,
    );
    const benefitsPlaceholderCents = this.multiplyRate(
      baseAmountCents,
      benefitsPlaceholderRate,
    );
    const platformFeeCents = this.multiplyRate(baseAmountCents, platformFeeRate);
    const workerNetPayCents =
      baseAmountCents - withholdingAmountCents - socialContributionAmountCents;
    const employerCostCents =
      baseAmountCents + employerContributionAmountCents + benefitsPlaceholderCents;

    return {
      workerGrossPayCents: baseAmountCents,
      withholdingRate,
      withholdingAmountCents,
      socialContributionRate,
      socialContributionAmountCents,
      employerContributionRate,
      employerContributionAmountCents,
      benefitsPlaceholderRate,
      benefitsPlaceholderCents,
      platformFeeRate,
      platformFeeCents,
      workerNetPayCents,
      employerCostCents,
      escrowRequiredAmountCents: employerCostCents + platformFeeCents,
    };
  }

  private multiplyRate(amountCents: number, rate: number) {
    return Math.round(amountCents * (rate / 100));
  }
}
