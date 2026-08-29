import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async getMunicipalitiesAndNeighborhoods() {
    const list = await this.prisma.municipality.findMany({
      orderBy: { name: "asc" },
    });

    const municipalities = list.map((m) => m.name);
    const neighborhoods: Record<string, string[]> = {};

    for (const item of list) {
      neighborhoods[item.name] = item.neighborhoods;
    }

    return {
      municipalities,
      neighborhoods,
      fullList: list,
    };
  }

  async createMunicipality(name: string, neighborhoods: string[] = []) {
    return this.prisma.municipality.create({
      data: {
        name,
        neighborhoods,
      },
    });
  }

  async updateMunicipality(id: string, name?: string, neighborhoods?: string[]) {
    return this.prisma.municipality.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(neighborhoods && { neighborhoods }),
      },
    });
  }

  async deleteMunicipality(id: string) {
    await this.prisma.municipality.delete({ where: { id } });
    return { success: true };
  }

  async addNeighborhood(municipalityName: string, neighborhood: string) {
    const existing = await this.prisma.municipality.findUnique({
      where: { name: municipalityName },
    });
    if (!existing) {
      return this.prisma.municipality.create({
        data: {
          name: municipalityName,
          neighborhoods: [neighborhood],
        },
      });
    }

    if (!existing.neighborhoods.includes(neighborhood)) {
      return this.prisma.municipality.update({
        where: { name: municipalityName },
        data: {
          neighborhoods: [...existing.neighborhoods, neighborhood],
        },
      });
    }
    return existing;
  }
}
