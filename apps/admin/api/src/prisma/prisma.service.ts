import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  [key: string]: any;

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (error) {
      console.error('[PrismaService.onModuleInit]', error);
    }
  }
}
