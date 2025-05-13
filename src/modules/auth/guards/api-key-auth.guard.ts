import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.body.apiKey;

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      const tenant = await this.authService.validateApiKey(apiKey);
      request.tenant = tenant;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid API key');
    }
  }
} 