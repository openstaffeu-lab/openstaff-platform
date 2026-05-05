import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EscoService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.escoSkill.findMany();
  }

  create(data: any) {
    return this.prisma.escoSkill.create({ data });
  }
}
