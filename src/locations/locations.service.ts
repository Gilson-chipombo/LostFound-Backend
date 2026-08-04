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
    };
  }
}
