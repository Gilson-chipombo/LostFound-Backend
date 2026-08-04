import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("api/conversations")
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  getUserConversations(@CurrentUser("id") userId: string) {
    return this.conversationsService.getUserConversations(userId);
  }

  @Get(":id/messages")
  getMessages(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.conversationsService.getMessages(id, userId);
  }

  @Post(":id/messages")
  sendMessage(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("text") text: string,
  ) {
    return this.conversationsService.sendMessage(id, userId, text);
  }

  @Post()
  startConversation(
    @CurrentUser("id") userId: string,
    @Body("targetUserId") targetUserId: string,
    @Body("occurrenceId") occurrenceId?: string,
  ) {
    return this.conversationsService.createOrGetConversation(userId, targetUserId, occurrenceId);
  }
}
