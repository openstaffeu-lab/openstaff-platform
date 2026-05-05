import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NaceService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.nace.findMany();
  }

  create(data: any) {
    return this.prisma.nace.create({ data });
  }
}
