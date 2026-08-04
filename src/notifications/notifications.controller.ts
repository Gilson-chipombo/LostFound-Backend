import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Notificações")
@ApiBearerAuth()
@Controller("api/user/notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: "Listar notificações do utilizador autenticado" })
  @Get()
  getUserNotifications(@CurrentUser("id") userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @ApiOperation({ summary: "Marcar notificação como lida" })
  @Patch(":id/read")
  markAsRead(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }
}
