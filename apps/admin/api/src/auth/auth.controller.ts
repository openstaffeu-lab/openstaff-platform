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
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { RequestAccountRecoveryDto } from './dto/request-account-recovery.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
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

  @Public()
  @UseGuards(RateLimitGuard)
  @RateLimit({ key: 'auth-refresh', maxRequests: 20 })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: RefreshDto, @Req() req: any) {
    return this.authService.refresh(body.refreshToken, req);
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
