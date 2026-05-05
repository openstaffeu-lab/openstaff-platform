import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RequirePermissions } from '../access-control/permissions.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';
import { JwtGuard } from '../auth/jwt.guard';
import {
  buildInternalErrorResponse,
  logEndpointError,
} from '../common/api-response';
import { PublicFeedbackService } from './public-feedback.service';

@Controller()
export class PublicFeedbackController {
  constructor(private readonly publicFeedbackService: PublicFeedbackService) {}

  @Get('public-posts/:id/comments')
  async listComments(@Param('id') id: string) {
    try {
      return await this.publicFeedbackService.listComments(id);
    } catch (error) {
      logEndpointError('PublicFeedbackController.listComments', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts/:id/comments')
  async createComment(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicFeedbackService.createComment(id, body);
    } catch (error) {
      logEndpointError('PublicFeedbackController.createComment', error);
      return buildInternalErrorResponse(error);
    }
  }

  @Get('public-posts/:id/reviews')
  async listReviews(@Param('id') id: string) {
    try {
      return await this.publicFeedbackService.listReviews(id);
    } catch (error) {
      logEndpointError('PublicFeedbackController.listReviews', error);
      return buildInternalErrorResponse(error);
    }
  }

  @UseGuards(JwtGuard)
  @Post('public-posts/:id/reviews')
  async createReview(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Req() req: any,
  ) {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Authenticated user not found in request');
    }

    try {
      return await this.publicFeedbackService.createReview(id, body);
    } catch (error) {
      logEndpointError('PublicFeedbackController.createReview', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Get('admin/public-feedback')
  async listForAdmin() {
    try {
      return await this.publicFeedbackService.listForAdmin();
    } catch (error) {
      logEndpointError('PublicFeedbackController.listForAdmin', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/public-comments/:id/status')
  async updateCommentStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    try {
      return await this.publicFeedbackService.updateCommentStatus(
        id,
        typeof body.status === 'string' ? body.status : 'PENDING_REVIEW',
      );
    } catch (error) {
      logEndpointError('PublicFeedbackController.updateCommentStatus', error);
      return buildInternalErrorResponse(error);
    }
  }

  @RequirePermissions(Permission.MANAGE_USERS)
  @UseGuards(JwtGuard, PermissionsGuard)
  @Patch('admin/public-reviews/:id/status')
  async updateReviewStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    try {
      return await this.publicFeedbackService.updateReviewStatus(
        id,
        typeof body.status === 'string' ? body.status : 'PENDING_REVIEW',
      );
    } catch (error) {
      logEndpointError('PublicFeedbackController.updateReviewStatus', error);
      return buildInternalErrorResponse(error);
    }
  }
}
