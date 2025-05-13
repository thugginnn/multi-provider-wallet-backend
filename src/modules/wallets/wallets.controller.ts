import { Controller, Get, Post, Body, Param, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { InitiateDepositDto } from './dto/initiate-deposit.dto';
import { InitiateWithdrawalDto } from './dto/initiate-withdrawal.dto';
import { TransferDto } from './dto/transfer.dto';

@ApiTags('wallets')
@Controller('wallets')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new wallet' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async createWallet(
    @Request() req,
    @Body() body: CreateWalletDto,
  ) {
    return this.walletsService.createWallet(
      req.user.id,
      req.tenant.id,
      body.currency,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all wallets for the current user' })
  @ApiResponse({ status: 200, description: 'Return all wallets' })
  async getWallets(@Request() req) {
    return this.walletsService.getWalletsByUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific wallet' })
  @ApiResponse({ status: 200, description: 'Return the wallet' })
  async getWallet(@Param('id') id: string) {
    return this.walletsService.getWallet(id);
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Initiate a deposit' })
  @ApiResponse({ status: 201, description: 'Deposit initiated successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async initiateDeposit(
    @Param('id') id: string,
    @Body() body: InitiateDepositDto,
  ) {
    return this.walletsService.initiateDeposit(
      id,
      body.amount,
      body.provider,
      body.metadata || {},
    );
  }

  @Post(':id/withdraw')
  @ApiOperation({ summary: 'Initiate a withdrawal' })
  @ApiResponse({ status: 201, description: 'Withdrawal initiated successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async initiateWithdrawal(
    @Param('id') id: string,
    @Body() body: InitiateWithdrawalDto,
  ) {
    return this.walletsService.initiateWithdrawal(
      id,
      body.amount,
      body.provider,
      body.metadata || {},
    );
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer funds to another wallet' })
  @ApiResponse({ status: 201, description: 'Transfer initiated successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async transfer(
    @Param('id') id: string,
    @Body() body: TransferDto,
  ) {
    return this.walletsService.transfer(
      id,
      body.destinationWalletId,
      body.amount,
      body.metadata || {},
    );
  }
} 