# Multi-Provider Virtual Wallet & Payment System

A scalable and modular backend system for managing virtual wallets and facilitating payments across multiple fintech providers.

## Features

- Multi-tenant support for businesses
- Provider-agnostic transaction processing
- Wallet management (deposits, withdrawals, transfers)
- Transaction history and audit logs
- Idempotent transaction endpoints
- Webhook processing with replay capability
- JWT-based authentication
- Swagger API documentation

## Tech Stack

- NestJS (Node.js framework)
- TypeScript
- PostgreSQL
- TypeORM
- Redis (for caching)
- BullMQ (for background jobs)
- Docker
- Swagger/OpenAPI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Redis (v6 or higher)
- Docker and Docker Compose

## Environment Variables

Key environment variables (from `.env.example`):

- `PORT`: Server port (default: 3000)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT token generation

## Local Development Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-provider-wallet-backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development environment:
```bash
docker-compose up -d
npm run start:dev
```

5. Access the API documentation:
```
http://localhost:3000/api
```

## Docker Setup

The project includes a `docker-compose.yml` file for local development. Run:

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

## Project Structure

```
src/
├── config/           # Configuration files
├── modules/          # Feature modules
│   ├── auth/        # Authentication
│   ├── tenants/     # Multi-tenant management
│   ├── wallets/     # Wallet operations
│   ├── transactions/# Transaction processing
│   └── providers/   # Payment provider integrations
├── common/          # Shared utilities and middleware
├── database/        # Database migrations and seeds
└── main.ts         # Application entry point
```

## API Documentation

The API documentation is available at `/api` when running the application. It includes:

- Authentication endpoints
- Wallet management
- Transaction processing
- Webhook handling
- Admin operations

## Testing

```bash
# Unit tests
npm run test

# e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

The application is containerized and can be deployed to any cloud platform. For GCP deployment:

1. Build the Docker image:
```bash
docker build -t multi-provider-wallet .
```

2. Push to Google Container Registry:
```bash
docker tag multi-provider-wallet gcr.io/[PROJECT_ID]/multi-provider-wallet
docker push gcr.io/[PROJECT_ID]/multi-provider-wallet
```

3. Deploy to Cloud Run or GKE using the provided deployment configurations.

## Security

- JWT-based authentication
- Tenant isolation
- Rate limiting per tenant
- Input validation
- SQL injection prevention
- XSS protection

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
