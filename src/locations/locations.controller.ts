import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { LocationsService } from "./locations.service";
import { Public } from "../auth/guards/public.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("Localizações & Municípios")
@Controller("api/locations")
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Public()
  @ApiOperation({ summary: "Obter lista de municípios e bairros mapeados em Luanda" })
  @Get("municipalities")
  getMunicipalities() {
    return this.locationsService.getMunicipalitiesAndNeighborhoods();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar novo município (Apenas Admin)" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post("municipalities")
  createMunicipality(@Body("name") name: string, @Body("neighborhoods") neighborhoods?: string[]) {
    return this.locationsService.createMunicipality(name, neighborhoods || []);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar município ou lista de bairros (Apenas Admin)" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put("municipalities/:id")
  updateMunicipality(
    @Param("id") id: string,
    @Body("name") name?: string,
    @Body("neighborhoods") neighborhoods?: string[],
  ) {
    return this.locationsService.updateMunicipality(id, name, neighborhoods);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Eliminar município por ID (Apenas Admin)" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete("municipalities/:id")
  deleteMunicipality(@Param("id") id: string) {
    return this.locationsService.deleteMunicipality(id);
  }
}
