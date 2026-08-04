import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("api/user/notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  getUserNotifications(@CurrentUser("id") userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @Patch(":id/read")
  markAsRead(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }
}
