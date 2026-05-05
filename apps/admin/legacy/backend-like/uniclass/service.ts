import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UniclassService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.uniclass.findMany();
  }

  create(data: any) {
    return this.prisma.uniclass.create({ data });
  }
}
