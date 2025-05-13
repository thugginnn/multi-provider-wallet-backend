import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../entities/tenant.entity';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(name: string, settings?: any): Promise<Tenant> {
    const apiKey = this.generateApiKey();
    const tenant = this.tenantRepository.create({
      name,
      settings,
      apiKey,
      isActive: true,
    });
    return this.tenantRepository.save(tenant);
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }
    return tenant;
  }

  async findByApiKey(apiKey: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { apiKey },
      relations: ['users', 'wallets'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, data);
    return this.tenantRepository.save(tenant);
  }

  async deactivate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isActive = false;
    return this.tenantRepository.save(tenant);
  }

  async reactivate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.isActive = true;
    return this.tenantRepository.save(tenant);
  }

  async regenerateApiKey(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.apiKey = this.generateApiKey();
    return this.tenantRepository.save(tenant);
  }

  private generateApiKey(): string {
    return `sk_${crypto.randomBytes(32).toString('hex')}`;
  }
} 