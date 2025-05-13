import { Controller, Get, Post, Body, Param, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() body: CreateTenantDto) {
    return this.tenantsService.create(body.name, body.settings);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'Return all tenants' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tenant' })
  @ApiResponse({ status: 200, description: 'Return the tenant' })
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(@Param('id') id: string, @Body() data: UpdateTenantDto) {
    return this.tenantsService.update(id, data);
  }

  @Put(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deactivated successfully' })
  async deactivate(@Param('id') id: string) {
    return this.tenantsService.deactivate(id);
  }

  @Put(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant reactivated successfully' })
  async reactivate(@Param('id') id: string) {
    return this.tenantsService.reactivate(id);
  }

  @Put(':id/regenerate-api-key')
  @ApiOperation({ summary: 'Regenerate tenant API key' })
  @ApiResponse({ status: 200, description: 'API key regenerated successfully' })
  async regenerateApiKey(@Param('id') id: string) {
    return this.tenantsService.regenerateApiKey(id);
  }
} 