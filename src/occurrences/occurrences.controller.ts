import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from "@nestjs/swagger";
import { FilesInterceptor } from "@nestjs/platform-express";
import { OccurrencesService } from "./occurrences.service";
import { CreateOccurrenceDto } from "./dto/create-occurrence.dto";
import { UpdateOccurrenceDto } from "./dto/update-occurrence.dto";
import { QueryOccurrenceDto } from "./dto/query-occurrence.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Public } from "../auth/guards/public.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { OccurrenceStatus } from "@prisma/client";

@ApiTags("Ocorrências")
@Controller("api/occurrences")
export class OccurrencesController {
  constructor(
    private readonly occurrencesService: OccurrencesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Public()
  @ApiOperation({ summary: "Obter estatísticas públicas globais para a Homepage" })
  @Get("stats/public")
  getPublicStats() {
    return this.occurrencesService.getPublicStats();
  }

  @Public()
  @ApiOperation({ summary: "Listar ocorrências com filtros (tipo, categoria, município, busca)" })
  @Get()
  findAll(@Query() query: QueryOccurrenceDto) {
    return this.occurrencesService.findAll(query);
  }

  @Public()
  @ApiOperation({ summary: "Obter detalhe de uma ocorrência por ID" })
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.occurrencesService.findOne(id);
  }

  @Public()
  @ApiOperation({ summary: "Obter correspondências sugeridas para uma ocorrência" })
  @Get(":id/matches")
  async getMatches(@Param("id") id: string) {
    const occ = await this.occurrencesService.findOne(id);
    return occ.matches || [];
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Criar uma nova ocorrência com fotos (upload para Cloudinary)" })
  @ApiConsumes("multipart/form-data")
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor("files", 5))
  async create(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateOccurrenceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    let images: string[] = dto.images || [];

    if (files && files.length > 0) {
      const uploadedUrls = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadFile(file)),
      );
      images = [...images, ...uploadedUrls];
    }

    return this.occurrencesService.create(userId, {
      ...dto,
      images,
    });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar dados de uma ocorrência" })
  @ApiConsumes("multipart/form-data")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @UseInterceptors(FilesInterceptor("files", 5))
  async update(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("role") role: any,
    @Body() dto: UpdateOccurrenceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    let images: string[] = dto.images || [];

    if (files && files.length > 0) {
      const uploadedUrls = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadFile(file)),
      );
      images = [...images, ...uploadedUrls];
    }

    return this.occurrencesService.update(id, userId, role, {
      ...dto,
      ...(images.length > 0 && { images }),
    });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar o estado de uma ocorrência (ex.: ATIVO, EM_ANALISE, RESOLVIDO)" })
  @UseGuards(JwtAuthGuard)
  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("role") role: any,
    @Body("status") statusStr: string,
  ) {
    const statusUpper = statusStr.toUpperCase() as OccurrenceStatus;
    return this.occurrencesService.updateStatus(id, userId, role, statusUpper);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: "Eliminar uma ocorrência" })
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(
    @Param("id") id: string,
    @CurrentUser("id") userId: string,
    @CurrentUser("role") role: any,
  ) {
    return this.occurrencesService.remove(id, userId, role);
  }
}
