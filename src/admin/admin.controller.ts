import { Controller, Get, Put, Body, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";

@Controller("api/admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("stats")
  getStats() {
    return this.adminService.getStats();
  }

  @Get("activities")
  getActivities() {
    return this.adminService.getActivities();
  }

  @Get("settings")
  getSettings() {
    return this.adminService.getSettings();
  }

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
