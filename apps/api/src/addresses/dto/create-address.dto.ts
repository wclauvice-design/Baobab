import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MinLength(2)
  label: string;

  @IsString()
  @MinLength(5)
  fullAddress: string;

  @IsString()
  @MinLength(2)
  city: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
