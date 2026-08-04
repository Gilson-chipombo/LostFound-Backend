import { Injectable, ConflictException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: "asc" },
    });
    return categories.map((c) => c.name);
  }

  async create(name: string, icon?: string) {
    const existing = await this.prisma.category.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException("Esta categoria já existe.");
    }
    return this.prisma.category.create({
      data: { name, icon },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException("Categoria não encontrada.");
    }
    await this.prisma.category.delete({ where: { id } });
    return { success: true };
  }
}
