import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany();
  }

  async create(data: { name: string; location: string; status: string }) {
    return this.prisma.project.create({
      data,
    });
  }
}