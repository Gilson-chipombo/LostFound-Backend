import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, IsDateString } from "class-validator";
import { Transform } from "class-transformer";
import { OccurrenceType } from "@prisma/client";

export class CreateOccurrenceDto {
  @IsEnum(OccurrenceType, { message: "Tipo deve ser PERDIDO, ENCONTRADO ou AVISO." })
  @IsNotEmpty({ message: "Tipo da ocorrência é obrigatório." })
  type: OccurrenceType;

  @IsString()
  @IsNotEmpty({ message: "Título é obrigatório." })
  title: string;

  @IsString()
  @IsNotEmpty({ message: "Descrição é obrigatória." })
  description: string;

  @IsString()
  @IsNotEmpty({ message: "Categoria é obrigatória." })
  category: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return value;
  })
  @IsArray()
  features?: string[];

  @IsString()
  @IsNotEmpty({ message: "Município é obrigatório." })
  municipality: string;

  @IsString()
  @IsNotEmpty({ message: "Bairro é obrigatório." })
  neighborhood: string;

  @IsString()
  @IsNotEmpty({ message: "Localização textual é obrigatória." })
  location: string;

  @IsDateString({}, { message: "Data inválida." })
  @IsNotEmpty({ message: "Data é obrigatória." })
  date: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [value];
    }
    return value;
  })
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactWhatsapp?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;
}
