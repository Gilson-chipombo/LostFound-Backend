import { Controller, Get, Post, Patch, Body, Param, UseGuards } from "@nestjs/common";
import { ReportsService } from "./reports.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Role } from "@prisma/client";

@Controller("api")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("reports")
  createReport(
    @CurrentUser("id") userId: string,
    @Body("occurrenceId") occurrenceId: string,
    @Body("reason") reason: string,
  ) {
    return this.reportsService.createReport(userId, occurrenceId, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get("admin/reports")
  findAllAdmin() {
    return this.reportsService.findAllAdmin();
  }

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
