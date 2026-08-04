import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("Administração")
@ApiBearerAuth()
@Controller("api/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: "Obter estatísticas globais da plataforma (Apenas Admin)" })
  @Get("stats")
  getStats() {
    return this.adminService.getStats();
  }

  @ApiOperation({ summary: "Obter histórico de atividades recentes do sistema (Apenas Admin)" })
  @Get("activities")
  getActivities() {
    return this.adminService.getActivities();
  }

  @ApiOperation({ summary: "Obter configurações do sistema (Apenas Admin)" })
  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

  @ApiOperation({ summary: "Atualizar configurações do sistema (moderação, % match) (Apenas Admin)" })
  @Put("settings")
  updateSettings(
    @Body("requireModeration") requireModeration?: boolean,
    @Body("minMatchPercent") minMatchPercent?: number,
    @Body("searchRadiusKm") searchRadiusKm?: number,
  ) {
    return this.adminService.updateSettings({
      requireModeration,
      minMatchPercent,
      searchRadiusKm,
    });
  }
}
