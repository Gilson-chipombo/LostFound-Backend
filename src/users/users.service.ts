import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Role } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getUserOccurrences(userId: string) {
    const list = await this.prisma.occurrence.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return list.map((occ) => ({
      id: occ.id,
      type: occ.type.toLowerCase(),
      title: occ.title,
      description: occ.description,
      category: occ.category,
      brand: occ.brand || undefined,
      model: occ.model || undefined,
      color: occ.color || undefined,
      features: occ.features || [],
      municipality: occ.municipality,
      neighborhood: occ.neighborhood,
      location: occ.location,
      date: occ.date ? new Date(occ.date).toISOString().split("T")[0] : "",
      status: occ.status.toLowerCase(),
      images: occ.images || [],
      contact: {
        phone: occ.contactPhone || undefined,
        whatsapp: occ.contactWhatsapp || undefined,
        email: occ.contactEmail || undefined,
      },
      createdAt: occ.createdAt,
    }));
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar }),
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      avatar: user.avatar,
    };
  }

  async findAllAdmin() {
    const users = await this.prisma.user.findMany({
      include: {
        _count: { select: { occurrences: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role.toLowerCase(),
      occurrences: u._count.occurrences,
      joined: u.createdAt.toISOString().split("T")[0],
    }));
  }

  async updateUserRole(id: string, role: Role) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { role },
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException("Utilizador não encontrado.");
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }
}
