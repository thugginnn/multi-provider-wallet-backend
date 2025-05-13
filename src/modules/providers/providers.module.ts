import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PaystackProvider } from './implementations/paystack.provider';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: 'PAYMENT_PROVIDERS',
      useFactory: (paystackProvider: PaystackProvider) => {
        return new Map([
          ['paystack', paystackProvider],
        ]);
      },
      inject: [PaystackProvider],
    },
    PaystackProvider,
  ],
  exports: ['PAYMENT_PROVIDERS'],
})
export class ProvidersModule {} 