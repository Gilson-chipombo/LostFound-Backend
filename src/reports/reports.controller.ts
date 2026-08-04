import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Role } from "@prisma/client";

@ApiTags("Denúncias & Moderação")
@ApiBearerAuth()
@Controller("api")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: "Criar denúncia sobre uma ocorrência" })
  @UseGuards(JwtAuthGuard)
  @Post("reports")
  createReport(
    @CurrentUser("id") userId: string,
    @Body("occurrenceId") occurrenceId: string,
    @Body("reason") reason: string,
  ) {
    return this.reportsService.createReport(userId, occurrenceId, reason);
  }

  @ApiOperation({ summary: "Listar todas as denúncias (Apenas Admin)" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get("admin/reports")
  findAllAdmin() {
    return this.reportsService.findAllAdmin();
  }

  @ApiOperation({ summary: "Resolver/Moderar denúncia (APROVAR, SUSPENDER ou REJEITAR) (Apenas Admin)" })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch("admin/reports/:id")
  resolveReport(
    @Param("id") id: string,
    @Body("action") action: "APROVAR" | "SUSPENDER" | "REJEITAR",
  ) {
    return this.reportsService.resolveReport(id, action);
  }
}
