import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { Role } from "@prisma/client";

@ApiTags("Utilizadores")
@ApiBearerAuth()
@Controller("api")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({ summary: "Listar ocorrências do utilizador autenticado" })
  @Get("user/occurrences")
  getUserOccurrences(@CurrentUser("id") userId: string) {
    return this.usersService.getUserOccurrences(userId);
  }

  @ApiOperation({ summary: "Atualizar perfil e foto do utilizador autenticado" })
  @ApiConsumes("multipart/form-data")
  @Put("user/profile")
  @UseInterceptors(FileInterceptor("avatar"))
  async updateProfile(
    @CurrentUser("id") userId: string,
    @Body("name") name?: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let avatarUrl: string | undefined;

    if (file) {
      avatarUrl = await this.cloudinaryService.uploadFile(file);
    }

    return this.usersService.updateProfile(userId, {
      name,
      avatar: avatarUrl,
    });
  }

  // Admin Routes
  @ApiOperation({ summary: "Listar todos os utilizadores (Apenas Admin)" })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get("users")
  findAllAdmin() {
    return this.usersService.findAllAdmin();
  }

  @ApiOperation({ summary: "Alterar papel do utilizador (ex.: ADMIN, UTILIZADOR) (Apenas Admin)" })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch("users/:id/role")
  updateUserRole(@Param("id") id: string, @Body("role") roleStr: string) {
    const roleUpper = roleStr.toUpperCase() as Role;
    return this.usersService.updateUserRole(id, roleUpper);
  }

  @ApiOperation({ summary: "Eliminar conta de utilizador por ID (Apenas Admin)" })
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete("users/:id")
  deleteUser(@Param("id") id: string) {
    return this.usersService.deleteUser(id);
  }
}
