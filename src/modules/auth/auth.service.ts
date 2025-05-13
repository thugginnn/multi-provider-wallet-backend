import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { TenantsService } from '../tenants/tenants.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly tenantsService: TenantsService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['tenant'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        tenant: user.tenant,
      },
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    tenantId: string,
  ) {
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      tenant: { id: tenantId },
      isActive: true,
    });

    await this.userRepository.save(user);
    const { password: _, ...result } = user;
    return result;
  }

  async validateApiKey(apiKey: string): Promise<any> {
    const tenant = await this.tenantsService.findByApiKey(apiKey);
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException('Invalid or inactive API key');
    }
    return tenant;
  }

  async generateToken(tenant: any) {
    const payload = { sub: tenant.id, name: tenant.name };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
} 