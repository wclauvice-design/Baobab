import { Module } from "@nestjs/common";
import { CommerceService } from "./commerce.service";
import {
  CommerceAdminController,
  CommercePublicController,
  PublicRateGuard,
} from "./commerce.controller";
@Module({
  controllers: [CommerceAdminController, CommercePublicController],
  providers: [CommerceService, PublicRateGuard],
})
export class CommerceModule {}
