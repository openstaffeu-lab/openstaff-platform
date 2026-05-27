import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type ProjectListRecord = Prisma.ProjectGetPayload<{
  include: {
    createdBy: {
      select: {
        id: true;
        email: true;
        role: true;
      };
    };
    country: true;
    region: true;
    city: true;
    primaryLanguage: true;
    escoClassifications: {
      include: {
        escoSkill: true;
      };
    };
    naceClassifications: {
      include: {
        nace: true;
      };
    };
    uniclassClassifications: {
      include: {
        uniclass: true;
      };
    };
    jobRequests: {
      select: {
        id: true;
        status: true;
      };
    };
    aiInterpretation: {
      select: {
        id: true;
        status: true;
        updatedAt: true;
      };
    };
    _count: {
      select: {
        jobRequests: true;
        conditions: true;
        documents: true;
      };
    };
  };
}>;

type ProjectDetailRecord = Prisma.ProjectGetPayload<{
  include: {
    createdBy: {
      select: {
        id: true;
        email: true;
        role: true;
      };
    };
    country: true;
    region: true;
    city: true;
    primaryLanguage: true;
    escoClassifications: {
      include: {
        escoSkill: true;
      };
    };
    naceClassifications: {
      include: {
        nace: true;
      };
    };
    uniclassClassifications: {
      include: {
        uniclass: true;
      };
    };
    jobRequests: {
      include: {
        language: true;
        escoClassifications: {
          include: {
            escoSkill: true;
          };
        };
        naceClassifications: {
          include: {
            nace: true;
          };
        };
        uniclassClassifications: {
          include: {
            uniclass: true;
          };
        };
        conditions: true;
        documents: true;
      };
    };
    conditions: true;
    documents: true;
    aiInterpretation: true;
    _count: {
      select: {
        jobRequests: true;
        conditions: true;
        documents: true;
      };
    };
  };
}>;

type JobRequestRecord = ProjectDetailRecord['jobRequests'][number];
type ConditionRecord = ProjectDetailRecord['conditions'][number];
type DocumentRecord = ProjectDetailRecord['documents'][number];
type AIInterpretationRecord = {
  id: string;
  projectId: string;
  status: string;
  sourceText: string | null;
  extractedJson: string | null;
  documentIds: string | null;
  confidenceScore: number | null;
  modelName: string | null;
  modelVersion: string | null;
  promptVersion: string | null;
  reviewedById: string | null;
  reviewNotes: string | null;
  createdAt: Date;
  updatedAt?: Date | null;
};

@Injectable()
export class ProjectResponseMapper {
  toProjectListItem(project: ProjectListRecord) {
    const classifications = this.toProjectClassifications(project);

    return {
      id: project.id,
      slug: project.slug,
      name: project.name,
      summary: project.summary,
      status: project.status,
      engagementModel: project.engagementModel,
      visibility: project.visibility,
      location: project.location,
      startDate: project.startDate,
      endDate: project.endDate,
      responseDeadline: project.responseDeadline,
      publishedAt: project.publishedAt,
      archivedAt: project.archivedAt,
      budgetMinCents: project.budgetMinCents,
      budgetMaxCents: project.budgetMaxCents,
      currencyCode: project.currencyCode,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      createdById: project.createdById,
      owner: project.createdBy,
      geography: {
        country: project.country,
        region: project.region,
        city: project.city,
      },
      primaryLanguage: project.primaryLanguage,
      classifications,
      escoSkills: classifications.escoSkills,
      naceCodes: classifications.naceCodes,
      uniclassCodes: classifications.uniclassCodes,
      counts: {
        jobRequests: project._count.jobRequests,
        conditions: project._count.conditions,
        documents: project._count.documents,
        aiInterpretation: project.aiInterpretation ? 1 : 0,
      },
      aggregates: {
        jobRequestStatusCounts: this.countByStatus(project.jobRequests),
      },
      aiInterpretation: project.aiInterpretation
        ? {
            id: project.aiInterpretation.id,
            status: project.aiInterpretation.status,
            updatedAt: project.aiInterpretation.updatedAt,
          }
        : null,
    };
  }

  toProjectDetail(project: ProjectDetailRecord) {
    const listItem = this.toProjectListItem(project);

    return {
      ...listItem,
      description: project.description,
      scopeOfWork: project.scopeOfWork,
      address: {
        line1: project.addressLine1,
        line2: project.addressLine2,
        postalCode: project.postalCode,
        latitude: project.latitude,
        longitude: project.longitude,
      },
      conditions: project.conditions.map((condition) =>
        this.toConditionResponse(condition),
      ),
      documents: project.documents.map((document) =>
        this.toDocumentResponse(document),
      ),
      jobRequests: project.jobRequests.map((jobRequest) =>
        this.toJobRequestResponse(jobRequest),
      ),
      aiInterpretation: project.aiInterpretation
        ? this.toAIInterpretationResponse(project.aiInterpretation)
        : null,
      aggregates: {
        ...listItem.aggregates,
        mandatoryConditionCount: project.conditions.filter(
          (condition) => condition.isMandatory,
        ).length,
        publicDocumentCount: project.documents.filter(
          (document) => document.isPublic,
        ).length,
      },
    };
  }

  toJobRequestResponse(jobRequest: JobRequestRecord) {
    const classifications = {
      escoSkills: jobRequest.escoClassifications.map((item) => item.escoSkill),
      naceCodes: jobRequest.naceClassifications.map((item) => item.nace),
      uniclassCodes: jobRequest.uniclassClassifications.map(
        (item) => item.uniclass,
      ),
    };

    return {
      id: jobRequest.id,
      projectId: jobRequest.projectId,
      title: jobRequest.title,
      description: jobRequest.description,
      scopeOfWork: jobRequest.scopeOfWork,
      status: jobRequest.status,
      workerCount: jobRequest.workerCount,
      unit: jobRequest.unit,
      budgetMinCents: jobRequest.budgetMinCents,
      budgetMaxCents: jobRequest.budgetMaxCents,
      currencyCode: jobRequest.currencyCode,
      requiredExperienceYears: jobRequest.requiredExperienceYears,
      requiresCertification: jobRequest.requiresCertification,
      startDate: jobRequest.startDate,
      endDate: jobRequest.endDate,
      responseDeadline: jobRequest.responseDeadline,
      notes: jobRequest.notes,
      createdAt: jobRequest.createdAt,
      updatedAt: jobRequest.updatedAt,
      language: jobRequest.language,
      classifications,
      escoSkills: classifications.escoSkills,
      naceCodes: classifications.naceCodes,
      uniclassCodes: classifications.uniclassCodes,
      counts: {
        conditions: jobRequest.conditions.length,
        documents: jobRequest.documents.length,
      },
      conditions: jobRequest.conditions.map((condition) =>
        this.toConditionResponse(condition),
      ),
      documents: jobRequest.documents.map((document) =>
        this.toDocumentResponse(document),
      ),
    };
  }

  toConditionResponse(condition: ConditionRecord) {
    return {
      id: condition.id,
      projectId: condition.projectId,
      jobRequestId: condition.jobRequestId,
      type: condition.type,
      scope: condition.scope,
      title: condition.title,
      clauseKey: condition.clauseKey,
      content: condition.content,
      isMandatory: condition.isMandatory,
      sortOrder: condition.sortOrder,
      createdAt: condition.createdAt,
      updatedAt: condition.updatedAt,
    };
  }

  toDocumentResponse(document: DocumentRecord) {
    return {
      id: document.id,
      projectId: document.projectId,
      jobRequestId: document.jobRequestId,
      uploadedById: document.uploadedById,
      type: document.type,
      title: document.title,
      description: document.description,
      fileName: document.fileName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      isPublic: document.isPublic,
      checksumSha256: document.checksumSha256,
      extractionStatus: document.extractionStatus,
      extractionError: document.extractionError,
      extractedAt: document.extractedAt,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      storage: {
        provider: document.storageProvider,
        bucket: document.storageBucket,
        key: document.storageKey,
      },
    };
  }

  toAIInterpretationResponse(aiInterpretation: AIInterpretationRecord) {
    return {
      id: aiInterpretation.id,
      projectId: aiInterpretation.projectId,
      status: aiInterpretation.status,
      sourceText: aiInterpretation.sourceText,
      extractedJson: this.parseExtractedJson(aiInterpretation.extractedJson),
      documentIds: this.parseStringArray(aiInterpretation.documentIds),
      confidenceScore: aiInterpretation.confidenceScore,
      modelName: aiInterpretation.modelName,
      modelVersion: aiInterpretation.modelVersion,
      promptVersion: aiInterpretation.promptVersion,
      reviewedById: aiInterpretation.reviewedById,
      reviewNotes: aiInterpretation.reviewNotes,
      createdAt: aiInterpretation.createdAt,
      updatedAt: aiInterpretation.updatedAt ?? aiInterpretation.createdAt,
    };
  }

  private toProjectClassifications(
    project: Pick<
      ProjectListRecord,
      'escoClassifications' | 'naceClassifications' | 'uniclassClassifications'
    >,
  ) {
    return {
      escoSkills: project.escoClassifications.map((item) => item.escoSkill),
      naceCodes: project.naceClassifications.map((item) => item.nace),
      uniclassCodes: project.uniclassClassifications.map(
        (item) => item.uniclass,
      ),
    };
  }

  private countByStatus<T extends { status: string }>(items: T[]) {
    return items.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.status] = (accumulator[item.status] ?? 0) + 1;
      return accumulator;
    }, {});
  }

  private parseExtractedJson(value: string | null) {
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private parseStringArray(value: string | null) {
    if (!value) {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter(
            (item): item is string =>
              typeof item === 'string' && item.length > 0,
          )
        : [];
    } catch {
      return [];
    }
  }
}
