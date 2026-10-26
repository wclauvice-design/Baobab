import { IsBoolean, IsIn, IsObject, Max, MaxLength, IsUrl } from 'class-validator';
import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compareAtPrice?: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { each: true })
  images?: string[];
  @IsOptional() @IsString() sellerId?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) supplierPrice?: number;
  /**
   * Devise de saisie du commerçant (AED par défaut côté interface).
   * Si sourcePrice + sourceCurrency sont fournis, le serveur calcule le prix XOF.
   */
  @IsOptional() @IsIn(['XOF', 'AED', 'EUR', 'USD']) sourceCurrency?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) sourcePrice?: number;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) sourcePublicPrice?: number;
  @IsOptional() @IsString() @MaxLength(100) subcategory?: string;
  @IsOptional() @IsIn(['NEW', 'USED', 'REFURBISHED']) condition?: string;
  @IsOptional() @IsString() @MaxLength(100) location?: string;
  @IsOptional() @IsInt() @Min(1) @Max(1000000) minimumOrder?: number;
  @IsOptional() @IsInt() @Min(1) @Max(1000000) packSize?: number;
  @IsOptional() @IsString() @MaxLength(40) unit?: string;
  @IsOptional() @IsBoolean() shippingIncluded?: boolean;
  @IsOptional() @IsString() @MaxLength(200) shippingDestination?: string;
  @IsOptional() @IsNumber({ maxDecimalPlaces: 3 }) @Min(0) weightKg?: number;
  @IsOptional() @IsString() @MaxLength(200) dimensions?: string;
  @IsOptional() @IsObject() attributes?: Record<string, string>;
}
