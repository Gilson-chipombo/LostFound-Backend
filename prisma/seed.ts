import { PrismaClient, Role, OccurrenceType, OccurrenceStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seeding da base de dados...");

  // Limpar tabelas
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.report.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.occurrence.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.municipality.deleteMany();
  await prisma.systemSettings.deleteMany();

  // Hash de senha padrão: '123456'
  const hashedPassword = await bcrypt.hash("123456", 10);

  // 1. Criar Utilizadores
  const admin = await prisma.user.create({
    data: {
      name: "Administrador",
      email: "admin@achadosluanda.ao",
      passwordHash: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const demoUser = await prisma.user.create({
    data: {
      name: "Utilizador Demo",
      email: "usuario@achadosluanda.ao",
      passwordHash: hashedPassword,
      role: Role.UTILIZADOR,
    },
  });

  const maria = await prisma.user.create({
    data: {
      name: "Maria Silva",
      email: "maria@example.ao",
      passwordHash: hashedPassword,
      role: Role.UTILIZADOR,
    },
  });

  const joao = await prisma.user.create({
    data: {
      name: "João Almeida",
      email: "joao@example.ao",
      passwordHash: hashedPassword,
      role: Role.UTILIZADOR,
    },
  });

  // 2. Criar Categorias
  const categoryNames = [
    "Eletrónicos",
    "Documentos",
    "Chaves",
    "Carteiras",
    "Bagagem",
    "Vestuário",
    "Joias",
    "Animais",
    "Outros",
  ];

  for (const name of categoryNames) {
    await prisma.category.create({ data: { name } });
  }

  // 3. Criar Municípios e Bairros
  const municipalitiesData = [
    { name: "Luanda", neighborhoods: ["Ingombota", "Maianga", "Rangel", "Sambizanga", "Samba"] },
    { name: "Belas", neighborhoods: ["Benfica", "Futungo", "Morro Bento", "Talatona"] },
    { name: "Talatona", neighborhoods: ["Condomínio Jardins", "Camama", "Nova Vida"] },
    { name: "Cazenga", neighborhoods: ["Cazenga Sede", "Hoji-ya-Henda", "Tala Hady"] },
    { name: "Cacuaco", neighborhoods: ["Cacuaco Sede", "Kikolo", "Sequele"] },
    { name: "Viana", neighborhoods: ["Viana Sede", "Zango", "Estalagem"] },
    { name: "Kilamba Kiaxi", neighborhoods: ["Kilamba", "Golfe", "Palanca"] },
    { name: "Icolo e Bengo", neighborhoods: ["Catete", "Bom Jesus"] },
  ];

  for (const m of municipalitiesData) {
    await prisma.municipality.create({ data: m });
  }

  // 4. Configurações de Sistema
  await prisma.systemSettings.create({
    data: {
      id: "default",
      requireModeration: false,
      minMatchPercent: 60,
      searchRadiusKm: 15,
    },
  });

  // Helper para imagens Picsum
  const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/600`;

  // 5. Criar Ocorrências
  await prisma.occurrence.createMany({
    data: [
      {
        userId: maria.id,
        type: OccurrenceType.PERDIDO,
        title: "iPhone 14 Pro preto",
        description:
          "Perdi o meu iPhone 14 Pro cor preta na zona de Talatona, próximo do Belas Shopping. Tem capa transparente e um autocolante de cão pequeno na parte de trás.",
        category: "Eletrónicos",
        brand: "Apple",
        model: "iPhone 14 Pro",
        color: "Preto",
        features: ["Capa transparente", "Autocolante de cão"],
        municipality: "Belas",
        neighborhood: "Talatona",
        location: "Belas Shopping, entrada principal",
        date: new Date("2026-07-14"),
        status: OccurrenceStatus.ATIVO,
        images: [img("iphone1"), img("iphone2")],
        contactPhone: "+244 923 456 789",
        contactWhatsapp: "+244 923 456 789",
        contactEmail: "maria@example.ao",
      },
      {
        userId: joao.id,
        type: OccurrenceType.ENCONTRADO,
        title: "Carteira de couro castanha",
        description:
          "Encontrei esta carteira no autocarro da linha 108. Contém documentos em nome de um senhor. Contactem-me para devolução.",
        category: "Carteiras",
        color: "Castanho",
        municipality: "Luanda",
        neighborhood: "Ingombota",
        location: "Linha 108 - Terminal do Kinaxixi",
        date: new Date("2026-07-15"),
        status: OccurrenceStatus.ATIVO,
        images: [img("wallet1")],
        contactPhone: "+244 912 345 678",
        contactEmail: "joao@example.ao",
      },
      {
        userId: demoUser.id,
        type: OccurrenceType.AVISO,
        title: "Molho de chaves com pingente vermelho",
        description: "Chaves encontradas na praia da Ilha do Cabo. Estão no posto de socorro.",
        category: "Chaves",
        color: "Prateado",
        municipality: "Luanda",
        neighborhood: "Ilha",
        location: "Praia da Ilha, posto de socorro nº2",
        date: new Date("2026-07-16"),
        status: OccurrenceStatus.ATIVO,
        images: [img("keys1")],
        contactPhone: "+244 934 567 890",
      },
      {
        userId: maria.id,
        type: OccurrenceType.PERDIDO,
        title: "Mochila escolar azul",
        description: "Mochila da Nike, azul marinho, com cadernos e uma calculadora científica.",
        category: "Bagagem",
        brand: "Nike",
        color: "Azul",
        municipality: "Viana",
        neighborhood: "Zango",
        location: "Paragem Zango 3",
        date: new Date("2026-07-12"),
        status: OccurrenceStatus.EM_ANALISE,
        images: [img("bag1")],
        contactPhone: "+244 945 678 901",
      },
    ],
  });

  // 6. Criar Notificações Iniciais
  await prisma.notification.createMany({
    data: [
      {
        userId: demoUser.id,
        title: "Nova correspondência encontrada",
        description: "Alguém publicou algo semelhante ao seu item.",
        read: false,
      },
      {
        userId: demoUser.id,
        title: "Ocorrência aprovada",
        description: "A sua ocorrência foi validada com sucesso.",
        read: true,
      },
    ],
  });

  console.log("Seeding concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("Erro no seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
