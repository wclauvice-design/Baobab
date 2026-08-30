import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @IsInt()
  @Min(0)
  stock: number;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
