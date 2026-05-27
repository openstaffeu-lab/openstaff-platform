import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PlatformRole } from '@prisma/client';
import { CurrentActor } from '../auth/current-actor.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { PlatformRoles } from '../auth/platform-roles.decorator';
import { PlatformRolesGuard } from '../auth/platform-roles.guard';
import { CreateActorDto } from './dto/create-actor.dto';
import { UpdateActorDto } from './dto/update-actor.dto';
import { VerifyActorDto } from './dto/verify-actor.dto';
import { ActorsService } from './actors.service';

@Controller('actors')
export class ActorsController {
  constructor(private readonly actorsService: ActorsService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('verified') verified?: string,
    @Query('region') region?: string,
    @Query('nace') nace?: string,
  ) {
    return this.actorsService.findAll({
      page,
      limit,
      type,
      verified:
        typeof verified === 'string'
          ? verified.toLowerCase() === 'true'
          : undefined,
      region,
      nace,
    });
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Get('stats')
  stats() {
    return this.actorsService.getStats();
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  me(@CurrentActor() actor: any) {
    return this.actorsService.me(actor);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentActor() actor: any) {
    return this.actorsService.findOne(id, actor);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post()
  create(@Body() body: CreateActorDto, @Req() req: any) {
    return this.actorsService.create(body, req.firebaseUser);
  }

  @UseGuards(FirebaseAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateActorDto,
    @CurrentActor() actor: any,
  ) {
    return this.actorsService.update(id, body, actor);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Post(':id/verify')
  verify(
    @Param('id') id: string,
    @Body() body: VerifyActorDto,
    @CurrentActor() actor: any,
  ) {
    return this.actorsService.verify(id, { ...body, verified: true }, actor);
  }

  @UseGuards(FirebaseAuthGuard, PlatformRolesGuard)
  @PlatformRoles(PlatformRole.ADMIN, PlatformRole.SUPERADMIN)
  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() body: VerifyActorDto,
    @CurrentActor() actor: any,
  ) {
    return this.actorsService.verify(id, { ...body, verified: false }, actor);
  }
}
