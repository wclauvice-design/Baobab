import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  Header,
  Headers,
  HttpException,
  Injectable,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  AuthUser,
} from "../common/decorators/current-user.decorator";
import { CommerceService } from "./commerce.service";
import {
  AcceptQuoteDto,
  BusinessSettingsDto,
  CreateTradeDto,
  CustomerDto,
  EntryDto,
  LinkCustomerDto,
  MessageDto,
  NoticeDto,
  PaymentDeclarationDto,
  QuoteDto,
  StartConversationDto,
  StatusDto,
} from "./dto";

@Injectable()
export class PublicRateGuard implements CanActivate {
  private windows = new Map<string, { at: number; count: number }>();
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest(),
      res = context.switchToHttp().getResponse();
    res.setHeader("Cache-Control", "no-store");
    const now = Date.now(),
      key = `${req.ip}:${req.method === "GET" ? "read" : "write"}`;
    if (this.windows.size > 10000)
      for (const [key, entry] of this.windows)
        if (now - entry.at > 60000) this.windows.delete(key);
    const entry = this.windows.get(key);
    if (!entry || now - entry.at > 60000)
      this.windows.set(key, { at: now, count: 1 });
    else if (++entry.count > (req.method === "GET" ? 240 : 30))
      throw new HttpException(
        "Trop de demandes. Réessayez dans une minute.",
        429,
      );
    return true;
  }
}

@Controller("concierge")
@UseGuards(PublicRateGuard)
export class CommercePublicController {
  constructor(private service: CommerceService) {}
  @Get("config") config() {
    return this.service.configPublic();
  }
  @Post("conversations") start(
    @Body() dto: StartConversationDto,
    @Headers("x-westzone-access") token?: string,
  ) {
    return this.service.startConversation(dto, token);
  }
  @Get("conversations/:id") conversation(
    @Param("id") id: string,
    @Headers("x-westzone-access") token: string,
  ) {
    return this.service.readConversation(id, token);
  }
  @Post("conversations/:id/messages") message(
    @Param("id") id: string,
    @Headers("x-westzone-access") token: string,
    @Body() dto: MessageDto,
  ) {
    return this.service.message(id, dto, "CLIENT", token);
  }
  @Get("tracking/:id") track(
    @Param("id") id: string,
    @Headers("x-westzone-access") token: string,
  ) {
    return this.service.track(id, token);
  }
  @Post("tracking/:id/accept") accept(
    @Param("id") id: string,
    @Headers("x-westzone-access") token: string,
    @Body() dto: AcceptQuoteDto,
  ) {
    return this.service.accept(id, token, dto);
  }
  @Post("tracking/:id/payment") payment(
    @Param("id") id: string,
    @Headers("x-westzone-access") token: string,
    @Body() dto: PaymentDeclarationDto,
  ) {
    return this.service.declare(id, token, dto);
  }
  @Get("mine") @UseGuards(JwtAuthGuard) mine(@CurrentUser() user: AuthUser) {
    return this.service.mine(user.id);
  }
  @Get("mine/:id") @UseGuards(JwtAuthGuard) mineOne(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
  ) {
    return this.service.mineOne(user.id, id);
  }
}

@Controller("admin/concierge")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class CommerceAdminController {
  constructor(private service: CommerceService) {}
  @Get("overview") overview() {
    return this.service.overview();
  }
  @Get("counts") counts() {
    return this.service.adminCounts();
  }
  @Get("settings") settings() {
    return this.service.settings();
  }
  @Patch("settings") updateSettings(
    @Body() dto: BusinessSettingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateSettings(dto.whatsapp, user.id);
  }
  @Get("conversations") conversations() {
    return this.service.conversations();
  }
  @Get("conversations/:id") conversation(@Param("id") id: string) {
    return this.service.adminConversation(id);
  }
  @Post("conversations/:id/messages") message(
    @Param("id") id: string,
    @Body() dto: MessageDto,
  ) {
    return this.service.message(id, dto, "WESTZONE");
  }
  @Patch("conversations/:id/customer") link(
    @Param("id") id: string,
    @Body() dto: LinkCustomerDto,
  ) {
    return this.service.link(id, dto.customerId);
  }
  @Get("customers") customers(@Query("search") search?: string) {
    return this.service.customers(search);
  }
  @Post("customers") customer(@Body() dto: CustomerDto) {
    return this.service.createCustomer(dto);
  }
  @Get("orders") orders() {
    return this.service.all();
  }
  @Get("orders/:id") order(@Param("id") id: string) {
    return this.service.one(id);
  }
  @Post("orders") create(
    @Body() dto: CreateTradeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.create(dto, user.id);
  }
  @Post("orders/:id/quotes") quote(
    @Param("id") id: string,
    @Body() dto: QuoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.quote(id, dto, user.id);
  }
  @Post("orders/:id/rotate-link") rotate(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.rotate(id, user.id);
  }
  @Post("orders/:id/status") status(
    @Param("id") id: string,
    @Body() dto: StatusDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.status(id, dto, user.id);
  }
  @Post("orders/:id/entries") entry(
    @Param("id") id: string,
    @Body() dto: EntryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.entry(id, dto, user.id);
  }
  @Post("orders/:id/entries/:entryId/confirm") confirm(
    @Param("id") id: string,
    @Param("entryId") entryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.confirmEntry(id, entryId, true, user.id);
  }
  @Post("orders/:id/entries/:entryId/reject") reject(
    @Param("id") id: string,
    @Param("entryId") entryId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.confirmEntry(id, entryId, false, user.id);
  }
  @Post("orders/:id/close-costs") close(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.closeCosts(id, user.id);
  }
  @Post("orders/:id/remind") remind(
    @Param("id") id: string,
    @Body() dto: NoticeDto,
  ) {
    return this.service.reminder(id, dto.channel);
  }
}
