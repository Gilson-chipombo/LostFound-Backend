import { IsOptional, IsString } from "class-validator";

export class QueryOccurrenceDto {
  @IsOptional()
  @IsString()
  type?: string; // perdido | encontrado | aviso

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  municipality?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
