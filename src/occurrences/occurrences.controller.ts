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

@Controller("api/occurrences")
export class OccurrencesController {
  constructor(
    private readonly occurrencesService: OccurrencesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryOccurrenceDto) {
    return this.occurrencesService.findAll(query);
  }

  @Public()
  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.occurrencesService.findOne(id);
  }

  @Public()
  @Get(":id/matches")
  async getMatches(@Param("id") id: string) {
    const occ = await this.occurrencesService.findOne(id);
    return occ.matches || [];
  }

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
