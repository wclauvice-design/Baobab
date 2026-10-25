import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Identifiants par défaut du projet Supabase Baobab pour assurer la continuité
// immédiate de service même si les variables d'environnement manquent sur Render.
const DEFAULT_SUPABASE_URL = 'https://jptymtzrfahlhjcqpttg.supabase.co';
const DEFAULT_SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwdHltdHpyZmFobGhqY3FwdHRnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODA0MDQ0NCwiZXhwIjoyMTAzNjE2NDQ0fQ.Pt2xVt29tobsaqEjG6EKZ7sG6unZ9OpdoG3pd9wjBDs';
const DEFAULT_STORAGE_BUCKET = 'product-images';

@Injectable()
export class SupabaseStorageService {
  constructor(private config: ConfigService) {}

  async uploadProductImage(file: Express.Multer.File, productId: string): Promise<string> {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL') || DEFAULT_SUPABASE_URL;
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY') || DEFAULT_SUPABASE_SERVICE_KEY;
    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET') || DEFAULT_STORAGE_BUCKET;

    if (!supabaseUrl || !serviceKey) {
      throw new InternalServerErrorException("Le stockage d'images n'est pas configuré");
    }

    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': file.mimetype || 'image/jpeg',
      },
      body: new Uint8Array(file.buffer),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new InternalServerErrorException(`Échec de l'envoi de l'image (${res.status}): ${errText}`);
    }

    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
  }
}
