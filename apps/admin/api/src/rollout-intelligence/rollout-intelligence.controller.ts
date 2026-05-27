import { Body, Controller, Post, Req } from '@nestjs/common';
import {
  buildInternalErrorResponse,
  buildSuccessResponse,
  logEndpointError,
} from '../common/api-response';
import { RolloutIntelligenceService } from './rollout-intelligence.service';

@Controller('ops')
export class RolloutIntelligenceController {
  constructor(
    private readonly rolloutIntelligenceService: RolloutIntelligenceService,
  ) {}

  @Post('funnel-events')
  async recordFunnelEvent(
    @Body()
    body: {
      eventType?: string;
      surface?: string;
      sourceId?: string;
      metadata?: Record<string, unknown> | null;
      dedupeKey?: string | null;
    },
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.rolloutIntelligenceService.recordFunnelEvent(
          {
            eventType: body.eventType ?? '',
            surface: body.surface,
            sourceId: body.sourceId,
            metadata: body.metadata,
            dedupeKey: body.dedupeKey,
          },
          req,
          req.user ?? null,
        ),
      );
    } catch (error) {
      logEndpointError(
        'RolloutIntelligenceController.recordFunnelEvent',
        error,
      );
      return buildInternalErrorResponse(error);
    }
  }

  @Post('feedback')
  async recordOperationalFeedback(
    @Body()
    body: {
      feedbackType?: string;
      surface?: string;
      summary?: string;
      metadata?: Record<string, unknown> | null;
    },
    @Req() req: any,
  ) {
    try {
      return buildSuccessResponse(
        await this.rolloutIntelligenceService.recordOperationalFeedback(
          {
            feedbackType: body.feedbackType ?? '',
            surface: body.surface,
            summary: body.summary,
            metadata: body.metadata,
          },
          req,
          req.user ?? null,
        ),
      );
    } catch (error) {
      logEndpointError(
        'RolloutIntelligenceController.recordOperationalFeedback',
        error,
      );
      return buildInternalErrorResponse(error);
    }
  }
}
