import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
  Matches,
} from "class-validator";
import { Type } from "class-transformer";
import { ENTRY_KINDS, STAGES } from "./rules";

export class MessageDto {
  @IsString() @MinLength(1) @MaxLength(4000) body: string;
  @IsString() @MinLength(8) @MaxLength(100) requestKey: string;
}
export class StartConversationDto extends MessageDto {
  @IsOptional() @IsString() @MaxLength(100) productId?: string;
}
export class CustomerDto {
  @IsString() @MinLength(1) @MaxLength(100) firstName: string;
  @IsString() @MinLength(1) @MaxLength(100) lastName: string;
  @IsString() @MaxLength(30) phone: string;
  @IsOptional() @IsString() @MaxLength(30) whatsapp?: string;
  @IsOptional() @IsEmail() @MaxLength(254) email?: string;
  @IsString() @MinLength(2) @MaxLength(100) country: string;
  @IsString() @MinLength(2) @MaxLength(100) city: string;
  @IsString() @MinLength(3) @MaxLength(1000) address: string;
  @IsBoolean() messagingOptIn: boolean;
}
export class CreateTradeDto {
  @IsString() customerId: string;
  @IsOptional() @IsString() conversationId?: string;
}
export class QuoteLineDto {
  @IsString() productId: string;
  @IsInt() @Min(1) quantity: number;
  @IsString() unitPrice: string;
  @IsOptional() @IsString() @MaxLength(500) minimumException?: string;
}
export class QuoteDto {
  @IsInt() @Min(0) expectedRevision: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines: QuoteLineDto[];
  @IsString() logisticsCharge: string;
  @IsString() logisticsEstimate: string;
  @IsString() discount: string;
  @IsString() @MinLength(5) @MaxLength(4000) terms: string;
  @IsString() @MinLength(5) @MaxLength(1000) destination: string;
  @IsIn(["PREPAID", "DEPOSIT", "COD"]) paymentMode: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() @MaxLength(200) estimatedDelivery?: string;
  @IsString() expiresAt: string;
}
export class AcceptQuoteDto {
  @IsInt() @Min(1) revision: number;
}
export class StatusDto {
  @IsIn([...STAGES, "CANCELLED"]) status: string;
  @IsString() @MinLength(3) @MaxLength(1500) message: string;
}
export class EntryDto {
  @IsIn(ENTRY_KINDS) kind: string;
  @IsString() amount: string;
  @IsString() @MinLength(2) @MaxLength(300) reference: string;
  @IsOptional() @IsString() @MaxLength(1500) note?: string;
  @IsOptional() @IsString() supplierId?: string;
  @IsString() @MinLength(8) @MaxLength(100) requestKey: string;
  @IsOptional() @IsBoolean() pending?: boolean;
}
export class PaymentDeclarationDto {
  @IsString() amount: string;
  @IsString() @MinLength(2) @MaxLength(300) reference: string;
  @IsString() @MinLength(8) @MaxLength(100) requestKey: string;
}
export class LinkCustomerDto {
  @IsString() customerId: string;
}
export class NoticeDto {
  @IsIn(["EMAIL", "WHATSAPP"]) channel: string;
}
export class BusinessSettingsDto {
  @IsString() @Matches(/^\+[1-9]\d{7,14}$/) whatsapp: string;
}
export class ModerateDto {
  @IsIn(["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "ARCHIVED", "SOLD"])
  moderation: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @IsOptional() @IsString() publicPrice?: string;
}
