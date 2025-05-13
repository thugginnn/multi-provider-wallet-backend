import { Controller, Post, Body, Headers, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { TenantGuard } from '../auth/guards/tenant.guard';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(TenantGuard)
export class WebhookController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post(':provider')
  @ApiOperation({ summary: 'Handle payment provider webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Headers('x-paystack-signature') signature: string,
  ) {
    return this.walletsService.processWebhook(provider, payload, signature);
  }
} 