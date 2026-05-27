import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RuntimeConfigService } from '../config/runtime-config.service';
import {
  buildErrorResponse,
  buildSuccessResponse,
  isPrismaConnectionOrSchemaError,
  logEndpointError,
} from '../common/api-response';
import {
  cloneDemoPublicComments,
  cloneDemoPublicReviews,
} from '../common/public-interaction-demo';

@Injectable()
export class PublicFeedbackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  async listComments(postId: string) {
    try {
      const comments = await this.prisma.publicComment.findMany({
        where: { postId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(comments);
    } catch (error) {
      logEndpointError('PublicFeedbackService.listComments', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          return buildSuccessResponse([]);
        }

        return buildSuccessResponse(
          cloneDemoPublicComments().filter(
            (item: any) => item.postId === postId,
          ),
          'placeholder',
        );
      }

      throw error;
    }
  }

  async createComment(postId: string, body: Record<string, unknown>) {
    const data = {
      postId,
      authorName:
        typeof body.authorName === 'string'
          ? body.authorName
          : 'OpenStaff user',
      comment:
        typeof body.comment === 'string'
          ? body.comment
          : 'New public comment from OpenStaff.',
      status: typeof body.status === 'string' ? body.status : 'PENDING_REVIEW',
    };

    try {
      const comment = await this.prisma.publicComment.create({
        data: {
          postId,
          authorName: data.authorName,
          comment: data.comment,
          status: data.status as any,
        },
      });

      return buildSuccessResponse(comment);
    } catch (error) {
      logEndpointError('PublicFeedbackService.createComment', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          return buildErrorResponse(
            'Public comments are unavailable.',
            undefined,
            'PUBLIC_FEEDBACK_UNAVAILABLE',
          );
        }

        return buildSuccessResponse(
          {
            id: `placeholder-comment-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async listReviews(postId: string) {
    try {
      const reviews = await this.prisma.publicReview.findMany({
        where: { postId },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return buildSuccessResponse(reviews);
    } catch (error) {
      logEndpointError('PublicFeedbackService.listReviews', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          return buildSuccessResponse([]);
        }

        return buildSuccessResponse(
          cloneDemoPublicReviews().filter(
            (item: any) => item.postId === postId,
          ),
          'placeholder',
        );
      }

      throw error;
    }
  }

  async createReview(postId: string, body: Record<string, unknown>) {
    const parsedRating = Number(body.rating);
    const data = {
      postId,
      authorName:
        typeof body.authorName === 'string'
          ? body.authorName
          : 'OpenStaff user',
      rating: Number.isNaN(parsedRating) ? null : parsedRating,
      review:
        typeof body.review === 'string'
          ? body.review
          : 'New public review from OpenStaff.',
      status: typeof body.status === 'string' ? body.status : 'PENDING_REVIEW',
    };

    try {
      const review = await this.prisma.publicReview.create({
        data: {
          postId,
          authorName: data.authorName,
          rating: data.rating,
          review: data.review,
          status: data.status as any,
        },
      });

      return buildSuccessResponse(review);
    } catch (error) {
      logEndpointError('PublicFeedbackService.createReview', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          return buildErrorResponse(
            'Public reviews are unavailable.',
            undefined,
            'PUBLIC_FEEDBACK_UNAVAILABLE',
          );
        }

        return buildSuccessResponse(
          {
            id: `placeholder-review-${Date.now()}`,
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async listForAdmin() {
    try {
      const [comments, reviews] = await Promise.all([
        this.prisma.publicComment.findMany({
          include: {
            post: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.publicReview.findMany({
          include: {
            post: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
      ]);

      return buildSuccessResponse({ comments, reviews });
    } catch (error) {
      logEndpointError('PublicFeedbackService.listForAdmin', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          return buildSuccessResponse({
            comments: [],
            reviews: [],
          });
        }

        return buildSuccessResponse(
          {
            comments: cloneDemoPublicComments(),
            reviews: cloneDemoPublicReviews(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async updateCommentStatus(id: string, status: string) {
    try {
      const comment = await this.prisma.publicComment.update({
        where: { id },
        data: {
          status: status as any,
        },
        include: {
          post: true,
        },
      });

      return buildSuccessResponse(comment);
    } catch (error) {
      logEndpointError('PublicFeedbackService.updateCommentStatus', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          throw new NotFoundException('Public comment not found');
        }

        const comment = cloneDemoPublicComments().find(
          (item: any) => item.id === id,
        );

        if (!comment) {
          throw new NotFoundException('Public comment not found');
        }

        return buildSuccessResponse(
          {
            ...comment,
            status,
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }

  async updateReviewStatus(id: string, status: string) {
    try {
      const review = await this.prisma.publicReview.update({
        where: { id },
        data: {
          status: status as any,
        },
        include: {
          post: true,
        },
      });

      return buildSuccessResponse(review);
    } catch (error) {
      logEndpointError('PublicFeedbackService.updateReviewStatus', error);

      if (isPrismaConnectionOrSchemaError(error)) {
        if (!this.runtimeConfig.isDemoPublicFeedEnabled()) {
          throw new NotFoundException('Public review not found');
        }

        const review = cloneDemoPublicReviews().find(
          (item: any) => item.id === id,
        );

        if (!review) {
          throw new NotFoundException('Public review not found');
        }

        return buildSuccessResponse(
          {
            ...review,
            status,
            updatedAt: new Date().toISOString(),
          },
          'placeholder',
        );
      }

      throw error;
    }
  }
}
