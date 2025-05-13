import { Controller, Post, Body, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ApiKeyAuthGuard } from './guards/api-key-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBearerAuth()
  async register(
    @Request() req,
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    },
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.firstName,
      body.lastName,
      req.tenant.id,
    );
  }

  @Post('token')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ summary: 'Generate JWT token using API key' })
  @ApiResponse({ status: 200, description: 'Token generated successfully' })
  async generateToken(@Body('apiKey') apiKey: string) {
    const tenant = await this.authService.validateApiKey(apiKey);
    return this.authService.generateToken(tenant);
  }
} 