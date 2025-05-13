import { Controller, Get, Query, UseGuards, Request, Param, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { GetTransactionStatsDto } from './dto/get-transaction-stats.dto';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get transaction history' })
  @ApiResponse({ status: 200, description: 'Return transaction history' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTransactions(
    @Request() req,
    @Query() query: GetTransactionsDto,
  ) {
    return this.transactionsService.getTransactions({
      tenantId: req.tenant.id,
      userId: req.user.id,
      ...query,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get transaction statistics' })
  @ApiResponse({ status: 200, description: 'Return transaction statistics' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async getTransactionStats(
    @Request() req,
    @Query() query: GetTransactionStatsDto,
  ) {
    return this.transactionsService.getTransactionStats({
      tenantId: req.tenant.id,
      userId: req.user.id,
      ...query,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiResponse({ status: 200, description: 'Return transaction details' })
  async getTransaction(@Request() req, @Param('id') id: string) {
    return this.transactionsService.getTransaction(id, req.tenant.id, req.user.id);
  }
} 