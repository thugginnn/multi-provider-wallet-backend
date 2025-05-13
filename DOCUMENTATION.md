# Multi-Provider Wallet Backend Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Requirements](#requirements)
3. [Architecture](#architecture)
4. [API Documentation](#api-documentation)
5. [Database Schema](#database-schema)
6. [Security Implementation](#security-implementation)
7. [Bonus Features](#bonus-features)
8. [Setup and Installation](#setup-and-installation)

## Project Overview
A robust backend system for managing multi-provider wallets, supporting multiple tenants and various wallet providers. The system is built using NestJS, TypeORM, and PostgreSQL, following microservices architecture principles.

## Requirements

### Must-Have Features
1. **Multi-Provider Support**
   - Integration with multiple wallet providers
   - Provider-specific implementations
   - Unified API for wallet operations

2. **Wallet Management**
   - Create and manage wallets
   - Support for multiple currencies
   - Balance tracking and updates

3. **Transaction Processing**
   - Send and receive transactions
   - Transaction history
   - Status tracking and updates

4. **Security**
   - JWT-based authentication
   - API key validation
   - Secure transaction handling

### Bonus Features
1. **Multi-Tenant Support**
   - Tenant isolation
   - Custom configurations per tenant
   - API key management

2. **Advanced Features**
   - Transaction webhooks
   - Real-time balance updates
   - Provider failover handling

## Architecture

### Core Components
1. **Auth Module**
   - JWT authentication with refresh token rotation
   - Role-based access control (RBAC) implementation
   - API key management with rate limiting
   - Token blacklisting for logout
   - Password hashing using bcrypt

2. **Wallets Module**
   - Wallet creation with provider-specific initialization
   - Balance tracking with atomic updates
   - Provider integration using adapter pattern
   - Currency conversion handling
   - Balance caching with Redis

3. **Providers Module**
   - Provider-specific implementations using strategy pattern
   - Configuration management with environment variables
   - Error handling with custom exceptions
   - Provider health checks and failover
   - Rate limiting per provider

4. **Transactions Module**
   - Transaction processing with idempotency
   - History tracking with audit logs
   - Status management with state machine
   - Webhook processing with retry mechanism
   - Transaction queuing with BullMQ

5. **Tenants Module**
   - Tenant management with isolation
   - Configuration handling with JSON schema validation
   - API key generation with secure hashing
   - Tenant-specific rate limiting
   - Custom webhook configurations

### Design Patterns Used
1. **Repository Pattern**
   - Abstract database operations
   - TypeORM implementation
   - Query optimization

2. **Strategy Pattern**
   - Provider-specific implementations
   - Payment method handling
   - Currency conversion

3. **Factory Pattern**
   - Wallet creation
   - Provider instantiation
   - Transaction processing

4. **Observer Pattern**
   - Event handling
   - Webhook notifications
   - Status updates

5. **Adapter Pattern**
   - Provider integration
   - External API communication
   - Data transformation

### Data Flow

#### Wallet Creation Flow
1. Client request → Auth validation
2. Provider selection → Provider initialization
3. Wallet creation → Database persistence
4. Balance initialization → Cache update
5. Response with wallet details

#### Transaction Flow
1. Transaction request → Idempotency check
2. Balance validation → Provider selection
3. Transaction processing → Status update
4. Webhook notification → Event emission
5. Audit log creation → History update

### Technology Stack
- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **API Documentation**: Swagger

## API Documentation

### Authentication Endpoints

#### POST /auth/login
- **Description:** Authenticate user and return JWT tokens
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
  ```

#### POST /auth/refresh
- **Description:** Refresh JWT tokens
- **Request Body:**
  ```json
  {
    "refreshToken": "jwt-refresh-token"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
  ```

### Wallet Endpoints

#### POST /wallets
- **Description:** Create a new wallet for a tenant and provider
- **Request Body:**
  ```json
  {
    "tenantId": "uuid",
    "providerId": "uuid",
    "currency": "USD"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "providerId": "uuid",
    "balance": 0,
    "currency": "USD",
    "createdAt": "2024-05-13T12:00:00Z"
  }
  ```

#### GET /wallets
- **Description:** List all wallets for the authenticated tenant
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "providerId": "uuid",
      "balance": 100.5,
      "currency": "USD"
    }
  ]
  ```

#### GET /wallets/:id
- **Description:** Get wallet details by ID
- **Response:**
  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "providerId": "uuid",
    "balance": 100.5,
    "currency": "USD"
  }
  ```

#### GET /wallets/:id/balance
- **Description:** Get the current balance of a wallet
- **Response:**
  ```json
  {
    "balance": 100.5,
    "currency": "USD"
  }
  ```

### Transaction Endpoints

#### POST /transactions
- **Description:** Create a new transaction (deposit, withdrawal, transfer)
- **Request Body:**
  ```json
  {
    "walletId": "uuid",
    "type": "DEPOSIT",
    "amount": 50.0,
    "currency": "USD"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "walletId": "uuid",
    "type": "DEPOSIT",
    "amount": 50.0,
    "currency": "USD",
    "status": "PENDING",
    "createdAt": "2024-05-13T12:00:00Z"
  }
  ```

#### GET /transactions
- **Description:** List all transactions for the authenticated tenant
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "walletId": "uuid",
      "type": "DEPOSIT",
      "amount": 50.0,
      "currency": "USD",
      "status": "COMPLETED"
    }
  ]
  ```

#### GET /transactions/:id
- **Description:** Get transaction details by ID
- **Response:**
  ```json
  {
    "id": "uuid",
    "walletId": "uuid",
    "type": "DEPOSIT",
    "amount": 50.0,
    "currency": "USD",
    "status": "COMPLETED"
  }
  ```

### Provider Endpoints

#### GET /providers
- **Description:** List all available wallet providers
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "Paystack",
      "status": "ACTIVE"
    }
  ]
  ```

#### GET /providers/:id/status
- **Description:** Get the status of a specific provider
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Paystack",
    "status": "ACTIVE"
  }
  ```

### Tenant Endpoints

#### POST /tenants
- **Description:** Create a new tenant
- **Request Body:**
  ```json
  {
    "name": "Acme Corp"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Acme Corp",
    "apiKey": "string",
    "isActive": true,
    "createdAt": "2024-05-13T12:00:00Z"
  }
  ```

#### GET /tenants
- **Description:** List all tenants (admin only)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "apiKey": "string",
      "isActive": true
    }
  ]
  ```

#### GET /tenants/:id
- **Description:** Get tenant details by ID
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Acme Corp",
    "apiKey": "string",
    "isActive": true
  }
  ```

#### PUT /tenants/:id
- **Description:** Update tenant details
- **Request Body:**
  ```json
  {
    "name": "Acme Corp Updated",
    "isActive": false
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Acme Corp Updated",
    "apiKey": "string",
    "isActive": false
  }
  ```

## Additional API Endpoints

### Webhook Endpoints

#### POST /webhooks/transactions
- **Description:** Receive transaction status updates from providers
- **Request Body:**
  ```json
  {
    "provider": "Paystack",
    "transactionId": "uuid",
    "status": "COMPLETED",
    "amount": 50.0,
    "currency": "USD",
    "metadata": {}
  }
  ```
- **Response:**
  ```json
  {
    "success": true
  }
  ```

---

### Admin Endpoints

#### GET /admin/audit-logs
- **Description:** Retrieve system audit logs (admin only)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "action": "CREATE_WALLET",
      "userId": "uuid",
      "timestamp": "2024-05-13T12:00:00Z",
      "details": {}
    }
  ]
  ```

#### POST /admin/tenants/:id/activate
- **Description:** Activate a tenant (admin only)
- **Response:**
  ```json
  {
    "id": "uuid",
    "isActive": true
  }
  ```

---

### Provider-Specific Actions

#### POST /providers/:id/refresh-balance
- **Description:** Force refresh the balance from the provider
- **Response:**
  ```json
  {
    "providerId": "uuid",
    "balance": 120.0,
    "currency": "USD"
  }
  ```

#### POST /providers/:id/webhook-test
- **Description:** Trigger a test webhook event for a provider (admin only)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Test webhook sent"
  }
  ```

---

## Security Measures (Expanded)

### Authentication
- **JWT-based authentication**: All protected endpoints require a valid JWT in the `Authorization` header.
- **Refresh tokens**: Used for session renewal without re-authentication.
- **API key validation**: Each tenant is issued a unique API key for system-level access.

### Authorization
- **Role-based access control (RBAC)**: Roles such as `admin`, `tenant`, and `user` restrict access to sensitive endpoints.
- **Tenant isolation**: Data access is scoped to the authenticated tenant; cross-tenant access is prevented.
- **Admin endpoints**: Only users with the `admin` role can access system-wide or sensitive operations.

### Input Validation
- **DTO validation**: All incoming requests are validated using class-validator and DTOs.
- **TypeORM constraints**: Database-level constraints prevent invalid or duplicate data.
- **Sanitization**: User input is sanitized to prevent injection attacks.

### Data Protection
- **Password hashing**: User passwords are hashed using bcrypt before storage.
- **Sensitive data encryption**: API keys and secrets are encrypted at rest.
- **HTTPS enforcement**: All communication is expected to occur over HTTPS in production.

### Rate Limiting & Abuse Prevention
- **Per-tenant rate limiting**: Prevents abuse and DoS attacks by limiting requests per tenant.
- **Provider rate limiting**: Prevents overloading external provider APIs.
- **IP blacklisting**: Repeated abuse from an IP can result in temporary or permanent bans.

### Logging & Auditing
- **Audit logs**: All critical actions (e.g., wallet creation, fund transfer) are logged with user and timestamp.
- **Error logging**: All errors are logged for monitoring and incident response.

### Other Security Practices
- **Environment variable management**: Secrets are never hardcoded; all sensitive config is loaded from environment variables.
- **Dependency scanning**: Regularly scan for vulnerabilities in dependencies.
- **Automated tests**: Security-related tests are included in the CI pipeline.

## Database Schema

### Tenant Entity
```typescript
@Entity('tenants')
class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  apiKey: string;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { default: {} })
  settings: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Wallet Entity
```typescript
@Entity('wallets')
class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  providerId: string;

  @Column('decimal', { precision: 18, scale: 8 })
  balance: number;

  @Column()
  currency: string;

  @Column('jsonb')
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### Transaction Entity
```typescript
@Entity('transactions')
class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletId: string;

  @Column()
  type: TransactionType;

  @Column('decimal', { precision: 18, scale: 8 })
  amount: number;

  @Column()
  currency: string;

  @Column()
  status: TransactionStatus;

  @Column('jsonb')
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

## Security Implementation

### Authentication
- JWT-based authentication
- Token refresh mechanism
- Role-based access control

### API Security
- API key validation
- Rate limiting
- Request validation

### Data Security
- Encrypted sensitive data
- Secure password hashing
- Input validation

### Rate Limiting Implementation
```typescript
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = this.getRateLimitKey(request);
    const limit = this.configService.get('RATE_LIMIT');
    const window = this.configService.get('RATE_LIMIT_WINDOW');

    const current = await this.redisService.incr(key);
    if (current === 1) {
      await this.redisService.expire(key, window);
    }

    return current <= limit;
  }
}
```

### Error Handling
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = 
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

## Bonus Features

### Multi-Tenant Support
- Tenant isolation
- Custom configurations
- API key management

### Advanced Features
- Webhook support
- Real-time updates
- Provider failover

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Redis (optional)

### Environment Variables
```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key
```

### Installation Steps
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run migrations: `npm run migration:run`
5. Start the server: `npm run start:dev`

## Assessment Deliverables

### Code Quality
- Clean, maintainable code
- Proper error handling
- Comprehensive testing
- Documentation

### Architecture
- Modular design
- Scalable structure
- Clear separation of concerns

### Security
- Secure authentication
- Data protection
- Input validation

### Performance
- Efficient database queries
- Caching implementation
- Response time optimization 

## Sequence Diagrams

### Wallet Creation Flow
```mermaid
sequenceDiagram
    participant Client
    participant API as API Gateway
    participant Auth as Auth Service
    participant Provider as Provider Adapter
    participant DB as Database
    participant Cache as Redis Cache

    Client->>API: POST /wallets (with JWT)
    API->>Auth: Validate JWT
    Auth-->>API: Authenticated
    API->>Provider: Initialize wallet (provider-specific)
    Provider-->>API: Provider wallet ID
    API->>DB: Create wallet record
    DB-->>API: Wallet created
    API->>Cache: Set initial balance
    Cache-->>API: OK
    API-->>Client: Wallet details (ID, balance, provider info)
```

### Transaction Processing Flow
```mermaid
sequenceDiagram
    participant Client
    participant API as API Gateway
    participant Auth as Auth Service
    participant DB as Database
    participant Provider as Provider Adapter
    participant Queue as BullMQ
    participant Webhook as Webhook Handler

    Client->>API: POST /transactions (with JWT)
    API->>Auth: Validate JWT
    Auth-->>API: Authenticated
    API->>DB: Check idempotency key
    DB-->>API: Not found (proceed)
    API->>DB: Validate wallet & balance
    DB-->>API: Wallet OK
    API->>Provider: Initiate transaction
    Provider-->>API: Transaction result
    API->>DB: Save transaction record
    DB-->>API: Transaction saved
    API->>Queue: Enqueue for status update
    Queue-->>API: OK
    API->>Webhook: Notify external system
    Webhook-->>API: OK
    API-->>Client: Transaction response (status, ID)
``` 

## Detailed API Endpoints

### Authentication Endpoints

#### POST /auth/login
- **Description:** Authenticate user and return JWT tokens
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
  ```

#### POST /auth/refresh
- **Description:** Refresh JWT tokens
- **Request Body:**
  ```json
  {
    "refreshToken": "jwt-refresh-token"
  }
  ```
- **Response:**
  ```json
  {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
  ```

---

### Wallet Endpoints

#### POST /wallets
- **Description:** Create a new wallet for a tenant and provider
- **Request Body:**
  ```json
  {
    "tenantId": "uuid",
    "providerId": "uuid",
    "currency": "USD"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "providerId": "uuid",
    "balance": 0,
    "currency": "USD",
    "createdAt": "2024-05-13T12:00:00Z"
  }
  ```

#### GET /wallets
- **Description:** List all wallets for the authenticated tenant
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "providerId": "uuid",
      "balance": 100.5,
      "currency": "USD"
    }
  ]
  ```

#### GET /wallets/:id
- **Description:** Get wallet details by ID
- **Response:**
  ```json
  {
    "id": "uuid",
    "tenantId": "uuid",
    "providerId": "uuid",
    "balance": 100.5,
    "currency": "USD"
  }
  ```

#### GET /wallets/:id/balance
- **Description:** Get the current balance of a wallet
- **Response:**
  ```json
  {
    "balance": 100.5,
    "currency": "USD"
  }
  ```

---

### Transaction Endpoints

#### POST /transactions
- **Description:** Create a new transaction (deposit, withdrawal, transfer)
- **Request Body:**
  ```json
  {
    "walletId": "uuid",
    "type": "DEPOSIT",
    "amount": 50.0,
    "currency": "USD"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "walletId": "uuid",
    "type": "DEPOSIT",
    "amount": 50.0,
    "currency": "USD",
    "status": "PENDING",
    "createdAt": "2024-05-13T12:00:00Z"
  }
  ```

#### GET /transactions
- **Description:** List all transactions for the authenticated tenant
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "walletId": "uuid",
      "type": "DEPOSIT",
      "amount": 50.0,
      "currency": "USD",
      "status": "COMPLETED"
    }
  ]
  ```

#### GET /transactions/:id
- **Description:** Get transaction details by ID
- **Response:**
  ```json
  {
    "id": "uuid",
    "walletId": "uuid",
    "type": "DEPOSIT",
    "amount": 50.0,
    "currency": "USD",
    "status": "COMPLETED"
  }
  ```

---

### Provider Endpoints

#### GET /providers
- **Description:** List all available wallet providers
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "Paystack",
      "status": "ACTIVE"
    }
  ]
  ```

#### GET /providers/:id/status
- **Description:** Get the status of a specific provider
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Paystack",
    "status": "ACTIVE"
  }
  ```

---

### Tenant Endpoints

#### POST /tenants
- **Description:** Create a new tenant
- **Request Body:**
  ```json
  {
    "name": "Acme Corp"
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Acme Corp",
    "apiKey": "string",
    "isActive": true,
    "createdAt": "2024-05-13T12:00:00Z"
  }
  ```

#### GET /tenants
- **Description:** List all tenants (admin only)
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "apiKey": "string",
      "isActive": true
    }
  ]
  ```

#### GET /tenants/:id
- **Description:** Get tenant details by ID
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Acme Corp",
    "apiKey": "string",
    "isActive": true
  }
  ```

#### PUT /tenants/:id
- **Description:** Update tenant details
- **Request Body:**
  ```json
  {
    "name": "Acme Corp Updated",
    "isActive": false
  }
  ```
- **Response:**
  ```json
  {
    "id": "uuid",
    "name": "Acme Corp Updated",
    "apiKey": "string",
    "isActive": false
  }
  ``` 

## Assumptions & Trade-offs

- Assumed all providers support webhooks for transaction status updates.
- Used Redis for caching and rate limiting for simplicity and performance.
- Chose JWT for stateless authentication; OAuth2 could be used for more complex needs.
- Used TypeORM for rapid development; for high scale, a different ORM or raw SQL could be considered.
- Tenant isolation is enforced at the application layer; for stricter isolation, separate databases per tenant could be used.
- Swagger docs are provided at `/api` for API exploration and testing. 