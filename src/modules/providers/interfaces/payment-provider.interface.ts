import { Transaction } from '../../transactions/entities/transaction.entity';

export interface PaymentProviderConfig {
  apiKey: string;
  secretKey: string;
  webhookSecret?: string;
  environment: 'sandbox' | 'production';
  [key: string]: any;
}

export interface InitiatePaymentResponse {
  providerTransactionId: string;
  paymentUrl?: string;
  paymentInstructions?: string;
  metadata?: Record<string, any>;
}

export interface PaymentVerificationResponse {
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  providerTransactionId: string;
  metadata?: Record<string, any>;
}

export interface PaymentProvider {
  readonly name: string;
  readonly config: PaymentProviderConfig;

  initialize(config: PaymentProviderConfig): Promise<void>;
  
  initiatePayment(transaction: Transaction): Promise<InitiatePaymentResponse>;
  
  verifyPayment(transaction: Transaction): Promise<PaymentVerificationResponse>;
  
  processWebhook(payload: any, signature: string): Promise<{
    transaction: Transaction;
    status: 'success' | 'failed' | 'pending';
  }>;
  
  getBalance(): Promise<{
    available: number;
    pending: number;
    currency: string;
  }>;
} 