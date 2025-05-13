# Submission Note

Thank you for reviewing my submission for the Multi-Provider Wallet Backend technical assessment.

## Repository
- **GitHub:** [https://github.com/thugginnn/multi-provider-wallet-backend](https://github.com/thugginnn/multi-provider-wallet-backend)

## Key Features
- Multi-tenant and multi-provider wallet management
- Secure JWT authentication and API key validation
- Modular, scalable architecture (NestJS, TypeORM, PostgreSQL)
- Webhook, admin, and provider-specific endpoints
- Comprehensive documentation (`README.md` and `DOCUMENTATION.md`)
- Sequence diagrams and detailed API docs

## How to Run
1. Clone the repo and install dependencies (`npm install`)
2. Set up PostgreSQL and Redis (see README for Docker/local options)
3. Copy `.env.example` to `.env` and fill in your config
4. Run migrations (`npm run migration:run`)
5. Start the app (`npm run start:dev`)
6. Access API docs at `http://localhost:3000/api`

## Notes
- All sensitive config is in `.env.example`
- Please contact me if you have any issues running the project

Thank you for your time and consideration! 