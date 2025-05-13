import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TransactionsService } from '../transactions.service';

@Processor('transactions')
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  @Process('update-status')
  async handleUpdateStatus(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    const { transactionId, status } = job.data;
    // Implement logic to update transaction status
    this.logger.debug(`Transaction ${transactionId} status updated to ${status}`);
  }

  @Process('retry-webhook')
  async handleRetryWebhook(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
    const { transactionId, webhookUrl } = job.data;
    // Implement logic to retry webhook
    this.logger.debug(`Retrying webhook for transaction ${transactionId}`);
  }
} 