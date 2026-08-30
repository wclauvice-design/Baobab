import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { DeliveryMode, PaymentProviderType } from '@prisma/client';

class OrderItemInputDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @IsString()
  deliveryAddress: string;

  @IsEnum(DeliveryMode)
  deliveryMode: DeliveryMode;

  @IsEnum(PaymentProviderType)
  provider: PaymentProviderType;
}
