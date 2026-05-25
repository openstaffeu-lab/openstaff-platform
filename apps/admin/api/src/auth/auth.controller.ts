import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RateLimit } from '../common/rate-limit.decorator';
import { RateLimitGuard } from '../common/rate-limit.guard';
import { FirebaseExchangeDto } from './dto/firebase-exchange.dto';
import { LoginDto } from './dto/login.dto';
import { CompleteAccountRecoveryDto } from './dto/complete-account-recovery.dto';
import { DisableTwoFactorDto } from './dto/disable-two-factor.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { RequestAccountRecoveryDto } from './dto/request-account-recovery.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResendTwoFactorChallengeDto } from './dto/resend-two-factor-challenge.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyTwoFactorChallengeDto } from './dto/verify-two-factor-challenge.dto';
import { VerifyTwoFactorSetupDto } from './dto/verify-two-factor-setup.dto';
import { JwtGuard } from './jwt.guard';
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-register', maxRequests: 10 })
  @Post('register')
  async register(@Body() body: RegisterDto, @Req() req: any) {
    return this.authService.register(body, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-login', maxRequests: 10 })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Req() req: any) {
    return this.authService.login(body, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-password-reset-request', maxRequests: 5 })
  @Post('password-reset/request')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(
    @Body() body: RequestPasswordResetDto,
    @Req() req: any,
  ) {
    return this.authService.requestPasswordReset(body.email, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-password-reset-confirm', maxRequests: 10 })
  @Post('password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto, @Req() req: any) {
    return this.authService.resetPassword(body.token, body.password, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-account-recovery-request', maxRequests: 5 })
  @Post('account-recovery/request')
  @HttpCode(HttpStatus.OK)
  async requestAccountRecovery(
    @Body() body: RequestAccountRecoveryDto,
    @Req() req: any,
  ) {
    return this.authService.requestAccountRecovery(
      body.email,
      body.reason,
      body.note,
      req,
    );
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-account-recovery-complete', maxRequests: 10 })
  @Post('account-recovery/complete')
  @HttpCode(HttpStatus.OK)
  async completeAccountRecovery(
    @Body() body: CompleteAccountRecoveryDto,
    @Req() req: any,
  ) {
    return this.authService.completeAccountRecovery(body.token, body.password, req);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  async me(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('2fa/status')
  async getTwoFactorStatus(@Req() req: any) {
    return this.authService.getTwoFactorStatus(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@Req() req: any) {
    return this.authService.setupTwoFactor(req.user.sub, req);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/verify-setup')
  async verifyTwoFactorSetup(@Req() req: any, @Body() body: VerifyTwoFactorSetupDto) {
    return this.authService.verifyTwoFactorSetup(req.user.sub, body.challengeId, body.code, req);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/disable')
  async disableTwoFactor(@Req() req: any, @Body() body: DisableTwoFactorDto) {
    return this.authService.disableTwoFactor(req.user.sub, body.password, req);
  }

  @UseGuards(JwtGuard)
  @Post('2fa/recovery-codes/regenerate')
  async regenerateRecoveryCodes(@Req() req: any) {
    return this.authService.regenerateRecoveryCodes(req.user.sub, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-refresh', maxRequests: 20 })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshDto, @Req() req: any) {
    return this.authService.refresh(body.refreshToken, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-2fa-challenge-verify', maxRequests: 15 })
  @Post('2fa/challenge/verify')
  @HttpCode(HttpStatus.OK)
  async verifyTwoFactorChallenge(
    @Body() body: VerifyTwoFactorChallengeDto,
    @Req() req: any,
  ) {
    return this.authService.verifyTwoFactorChallenge(body.challengeId, body.code, req);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-2fa-challenge-resend', maxRequests: 10 })
  @Post('2fa/challenge/resend')
  @HttpCode(HttpStatus.OK)
  async resendTwoFactorChallenge(
    @Body() body: ResendTwoFactorChallengeDto,
    @Req() req: any,
  ) {
    return this.authService.resendTwoFactorChallenge(body.challengeId, req);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: any, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(req.user.sub, req);
    response.status(204);
  }

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-firebase-exchange', maxRequests: 10 })
  @Post('firebase-exchange')
  @HttpCode(HttpStatus.OK)
  async firebaseExchange(@Body() body: FirebaseExchangeDto, @Req() req: any) {
    return this.authService.firebaseExchange(body.idToken, req);
  }

  @UseGuards(JwtGuard)
  @Get('sessions')
  async sessions(@Req() req: any) {
    return this.authService.listSessions(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Delete('sessions/:id')
  async deleteSession(@Param('id') id: string, @Req() req: any) {
    return this.authService.revokeSession(id, req.user);
  }
}
