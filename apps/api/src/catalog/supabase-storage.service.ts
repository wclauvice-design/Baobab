import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SupabaseStorageService {
  constructor(private config: ConfigService) {}

  async uploadProductImage(file: Express.Multer.File, productId: string): Promise<string> {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET') || 'product-images';

    if (!supabaseUrl || !serviceKey) {
      throw new InternalServerErrorException("Le stockage d'images n'est pas configuré");
    }

    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.mimetype,
      },
      body: new Uint8Array(file.buffer),
    });

    if (!res.ok) {
      throw new InternalServerErrorException("Échec de l'envoi de l'image");
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
}
