import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ConversationsService } from "./conversations.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("Conversas & Mensagens (Chat)")
@ApiBearerAuth()
@Controller("api/conversations")
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @ApiOperation({ summary: "Listar conversas ativas do utilizador autenticado" })
  @Get()
  getUserConversations(@CurrentUser("id") userId: string) {
    return this.conversationsService.getUserConversations(userId);
  }

  @ApiOperation({ summary: "Obter lista de mensagens de uma conversa" })
  @Get(":id/messages")
  getMessages(@Param("id") id: string, @CurrentUser("id") userId: string) {
    return this.conversationsService.getMessages(id, userId);
  }

  @ApiOperation({ summary: "Enviar uma mensagem numa conversa" })
  @Post(":id/messages")
  sendMessage(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @Body("text") text: string,
  ) {
    return this.conversationsService.sendMessage(id, userId, text);
  }

  @ApiOperation({ summary: "Iniciar ou obter conversa com outro utilizador sobre uma ocorrência" })
  @Post()
  startConversation(
    @CurrentUser("id") userId: string,
    @Body("targetUserId") targetUserId: string,
    @Body("occurrenceId") occurrenceId?: string,
  ) {
    return this.conversationsService.createOrGetConversation(userId, targetUserId, occurrenceId);
  }
}
