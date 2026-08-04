import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuração do CORS para permitir comunicação com o frontend React/Vite
  app.enableCors({
    origin: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true,
  });

  // Pipe global para validação e transformação dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
    }),
  );

  // Proteção da documentação Swagger via Chave / HTTP Basic Auth
  const swaggerUser = process.env.SWAGGER_USER || "admin";
  const swaggerPass = process.env.SWAGGER_PASS || "lostfound_swagger_2026";
  const swaggerKey = process.env.SWAGGER_KEY || "lostfound_swagger_key_2026";

  app.use(["/api/docs", "/api/docs-json"], (req: any, res: any, next: any) => {
    // Permite acesso via query parameter ?key=... ou header x-swagger-key
    if (req.query?.key === swaggerKey || req.headers["x-swagger-key"] === swaggerKey) {
      return next();
    }

    // Permite acesso via HTTP Basic Auth
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Basic ")) {
      const b64 = authHeader.split(" ")[1];
      const [u, p] = Buffer.from(b64, "base64").toString().split(":");
      if (u === swaggerUser && p === swaggerPass) {
        return next();
      }
    }

    res.setHeader("WWW-Authenticate", 'Basic realm="Documentacao Swagger Protegida"');
    return res
      .status(401)
      .send("Acesso protegido. Introduza as credenciais ou a chave do Swagger no URL (?key=sua_chave).");
  });

  // Configuração da Documentação Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle("API Lost&Found Luanda")
    .setDescription("Documentação completa da API REST para gestão de objetos perdidos e encontrados em Luanda.")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`🚀 Servidor NestJS Lost&Found Luanda rodando na porta ${port}`);
  console.log(`📚 Documentação Swagger protegida disponível em http://localhost:${port}/api/docs`);
}

bootstrap();
