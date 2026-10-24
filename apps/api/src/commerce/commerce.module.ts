import { Module } from "@nestjs/common";
import { CommerceService } from "./commerce.service";
import {
  CommerceAdminController,
  CommercePublicController,
  PublicRateGuard,
} from "./commerce.controller";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [CommerceAdminController, CommercePublicController],
  providers: [CommerceService, PublicRateGuard],
})
export class CommerceModule {}
