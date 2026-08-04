import { v2 as cloudinary } from "cloudinary";
import { ConfigService } from "@nestjs/config";

export const CloudinaryProvider = {
  provide: "CLOUDINARY",
  useFactory: (configService: ConfigService) => {
    return cloudinary.config({
      cloud_name: configService.get<string>("CLOUDINARY_CLOUD_NAME", "demo"),
      api_key: configService.get<string>("CLOUDINARY_API_KEY", "1234567890"),
      api_secret: configService.get<string>("CLOUDINARY_API_SECRET", "sample_secret"),
    });
  },
  inject: [ConfigService],
};
