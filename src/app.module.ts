import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { CloudinaryModule } from "./cloudinary/cloudinary.module";
import { AuthModule } from "./auth/auth.module";
import { OccurrencesModule } from "./occurrences/occurrences.module";
import { CategoriesModule } from "./categories/categories.module";
import { LocationsModule } from "./locations/locations.module";
import { UsersModule } from "./users/users.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { ReportsModule } from "./reports/reports.module";
import { AdminModule } from "./admin/admin.module";

import { MailModule } from "./mail/mail.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CloudinaryModule,
    MailModule,
    AuthModule,
    OccurrencesModule,
    CategoriesModule,
    LocationsModule,
    UsersModule,
    NotificationsModule,
    ConversationsModule,
    ReportsModule,
    AdminModule,
  ],
})
export class AppModule {}
