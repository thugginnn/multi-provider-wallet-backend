import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Wallet } from '../../wallets/entities/wallet.entity';

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  apiKey: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  settings: {
    allowedProviders: string[];
    webhookUrl?: string;
    maxTransactionAmount?: number;
    minTransactionAmount?: number;
  };

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => Wallet, wallet => wallet.tenant)
  wallets: Wallet[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 