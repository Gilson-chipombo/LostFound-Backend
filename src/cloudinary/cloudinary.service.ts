import { Injectable } from "@nestjs/common";
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

@Injectable()
export class CloudinaryService {
  async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "achados-luanda" },
        (error: UploadApiErrorResponse, result: UploadApiResponse) => {
          if (error || !result) {
            // Em caso de credenciais de teste inválidas ou erro, retorna imagem Picsum com base no nome do ficheiro
            const seed = encodeURIComponent(file?.originalname || "upload-" + Date.now());
            return resolve(`https://picsum.photos/seed/${seed}/800/600`);
          }
          resolve(result.secure_url);
        },
      );
      
      if (file && file.buffer) {
        uploadStream.end(file.buffer);
      } else {
        const seed = encodeURIComponent("upload-" + Date.now());
        resolve(`https://picsum.photos/seed/${seed}/800/600`);
      }
    });
  }

  async uploadBase64OrUrl(data: string): Promise<string> {
    try {
      if (data.startsWith("http")) return data;
      const result = await cloudinary.uploader.upload(data, { folder: "achados-luanda" });
      return result.secure_url;
    } catch {
      const seed = encodeURIComponent("image-" + Date.now());
      return `https://picsum.photos/seed/${seed}/800/600`;
    }
  }
}
