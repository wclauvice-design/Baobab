import { IsString, MinLength } from 'class-validator';

export class RegisterSellerDto {
  @IsString()
  @MinLength(2)
  shopName: string;

  @IsString()
  @MinLength(2)
  city: string;
}
