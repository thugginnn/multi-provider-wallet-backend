import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PaymentProvider, PaymentProviderConfig, InitiatePaymentResponse, PaymentVerificationResponse } from '../interfaces/payment-provider.interface';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { AxiosResponse } from 'axios';

@Injectable()
export class PaystackProvider implements PaymentProvider {
  readonly name = 'paystack';
  private _config: PaymentProviderConfig;
  private baseUrl: string;

  constructor(private readonly httpService: HttpService) {}

  get config(): PaymentProviderConfig {
    return this._config;
  }

  async initialize(config: PaymentProviderConfig): Promise<void> {
    this._config = config;
    this.baseUrl = config.environment === 'production'
      ? 'https://api.paystack.co'
      : 'https://api.paystack.co';
  }

  async initiatePayment(transaction: Transaction): Promise<InitiatePaymentResponse> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            amount: transaction.amount * 100, // Convert to kobo
            email: transaction.metadata?.customerEmail,
            currency: transaction.currency,
            reference: transaction.idempotencyKey,
            callback_url: transaction.metadata?.callbackUrl,
            metadata: {
              custom_fields: [
                {
                  display_name: 'Transaction ID',
                  variable_name: 'transaction_id',
                  value: transaction.id,
                },
              ],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this._config.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        providerTransactionId: response.data.data.reference,
        paymentUrl: response.data.data.authorization_url,
        metadata: {
          accessCode: response.data.data.access_code,
        },
      };
    } catch (error) {
      throw new Error(`Failed to initiate Paystack payment: ${error.message}`);
    }
  }

  async verifyPayment(transaction: Transaction): Promise<PaymentVerificationResponse> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/transaction/verify/${transaction.providerTransactionId}`,
          {
            headers: {
              Authorization: `Bearer ${this._config.secretKey}`,
            },
          },
        ),
      );

      const data = response.data.data;
      return {
        status: data.status === 'success' ? 'success' : 'failed',
        amount: data.amount / 100, // Convert from kobo
        currency: data.currency,
        providerTransactionId: data.reference,
        metadata: {
          gatewayResponse: data.gateway_response,
          channel: data.channel,
          paidAt: data.paid_at,
        },
      };
    } catch (error) {
      throw new Error(`Failed to verify Paystack payment: ${error.message}`);
    }
  }

  async processWebhook(payload: any, signature: string): Promise<{
    transaction: Transaction;
    status: 'success' | 'failed' | 'pending';
  }> {
    // Verify webhook signature
    const computedSignature = this.computeWebhookSignature(payload);
    if (computedSignature !== signature) {
      throw new Error('Invalid webhook signature');
    }

    const event = payload.event;
    const data = payload.data;

    if (event === 'charge.success') {
      return {
        transaction: {
          id: data.metadata.transaction_id,
          providerTransactionId: data.reference,
          status: 'completed',
        } as Transaction,
        status: 'success',
      };
    } else if (event === 'charge.failed') {
      return {
        transaction: {
          id: data.metadata.transaction_id,
          providerTransactionId: data.reference,
          status: 'failed',
          error: {
            code: data.gateway_response,
            message: data.gateway_response,
          },
        } as Transaction,
        status: 'failed',
      };
    }

    return {
      transaction: {
        id: data.metadata.transaction_id,
        providerTransactionId: data.reference,
        status: 'pending',
      } as Transaction,
      status: 'pending',
    };
  }

  async getBalance(): Promise<{
    available: number;
    pending: number;
    currency: string;
  }> {
    try {
      const response: AxiosResponse = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/balance`,
          {
            headers: {
              Authorization: `Bearer ${this._config.secretKey}`,
            },
          },
        ),
      );

      const data = response.data.data;
      return {
        available: data.balance / 100,
        pending: data.pending_balance / 100,
        currency: data.currency,
      };
    } catch (error) {
      throw new Error(`Failed to get Paystack balance: ${error.message}`);
    }
  }

  private computeWebhookSignature(payload: any): string {
    const crypto = require('crypto');
    return crypto
      .createHmac('sha512', this._config.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');
  }
} 