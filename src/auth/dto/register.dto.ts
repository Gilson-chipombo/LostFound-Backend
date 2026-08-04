import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "@prisma/client";

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: "O nome é obrigatório." })
  name: string;

  @IsEmail({}, { message: "O email deve ser um endereço válido." })
  @IsNotEmpty({ message: "O email é obrigatório." })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "A palavra-passe é obrigatória." })
  @MinLength(6, { message: "A palavra-passe deve ter pelo menos 6 caracteres." })
  password: string;

  @IsOptional()
  role?: Role;
}
