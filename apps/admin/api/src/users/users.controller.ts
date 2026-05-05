import { Body, Controller, Get, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Post('register')
  async register(
    @Body()
    body: { email: string; password: string; role: Role },
  ) {
    return this.usersService.create(body);
  }
}