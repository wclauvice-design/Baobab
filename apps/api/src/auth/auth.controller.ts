import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthRateGuard implements CanActivate {
  private windows = new Map<string, { at: number; count: number }>();

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const now = Date.now();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `auth:${ip}`;

    // Nettoyage régulier des fenêtres expirées (> 60s)
    if (this.windows.size > 5000) {
      for (const [k, v] of this.windows) {
        if (now - v.at > 60000) this.windows.delete(k);
      }
    }

    const entry = this.windows.get(key);
    if (!entry || now - entry.at > 60000) {
      this.windows.set(key, { at: now, count: 1 });
    } else {
      entry.count++;
      // Limite stricte : max 5 requêtes d'authentification par minute par adresse IP
      if (entry.count > 5) {
        throw new HttpException(
          'Trop de tentatives d’authentification. Veuillez patienter une minute.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
    return true;
  }
}

@Controller('auth')
@UseGuards(AuthRateGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('otp/request')
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.code);
  }

  // Connexion de test sécurisée (réservée à l'admin et aux commerçants vérifiés)
  @Post('dev-login')
  devLogin(@Body('phone') phone: string) {
    return this.authService.devLogin(phone);
  }
}
