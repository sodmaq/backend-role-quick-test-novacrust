# Wallet Service - NestJS + MongoDB

A simple, production-ready wallet service built with NestJS and MongoDB.

## Features

✅ **Core Functionality**

- Create wallets with unique IDs
- Fund wallets with validation
- Transfer funds between wallets
- Fetch wallet details with transaction history

✅ **Best Practices**

- Request validation using class-validator
- Comprehensive error handling
- Idempotency support for fund/transfer operations
- Transaction audit trail
- Balance integrity checks

✅ **Bonus Features**

- Idempotent operations (prevents duplicate transactions)
- Unit tests included
- Production scaling notes

## Project Structure

```
src/
├── wallets/
│   ├── dto/
│   │   └── wallet.dto.ts          # Request DTOs with validation
│   ├── schemas/
│   │   ├── wallet.schema.ts       # Wallet MongoDB schema
│   │   └── transaction.schema.ts  # Transaction MongoDB schema
│   ├── wallets.controller.ts      # API endpoints
│   ├── wallets.service.ts         # Business logic
│   ├── wallets.service.spec.ts    # Unit tests
│   └── wallets.module.ts          # Module configuration
├── app.module.ts                   # Root module
└── main.ts                         # Application entry point
```

## Prerequisites

- Node.js (v16+)
- MongoDB (v4.4+)
- npm or yarn

## Installation

```bash
# Clone and setup
npm install

# Install NestJS CLI globally (if not already installed)
npm i -g @nestjs/cli

# Install dependencies
npm install @nestjs/mongoose mongoose
npm install class-validator class-transformer
npm install @nestjs/config
```

## Configuration

Make sure MongoDB is running on `mongodb://localhost:27017/wallet-service`

To change the connection string, edit `src/app.module.ts`:

```typescript
MongooseModule.forRoot('your-mongodb-connection-string');
```

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## Running Tests

```bash
# Unit tests
npm run test

# Test coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

## API Documentation

### 1. Create Wallet

**Endpoint:** `POST /wallets`

**Request Body:**

```json
{
  "id": "user-123",
  "currency": "USD",
  "balance": 0
}
```

**Success Response (201):**

```json
{
  "id": "user-123",
  "currency": "USD",
  "balance": 0,
  "_id": "...",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**

- `400` - Validation error
- `409` - Wallet already exists

---

### 2. Fund Wallet

**Endpoint:** `POST /wallets/:id/fund`

**Request Body:**

```json
{
  "amount": 1000,
  "reference": "Initial deposit",
  "idempotencyKey": "unique-key-123"
}
```

**Success Response (200):**

```json
{
  "id": "user-123",
  "currency": "USD",
  "balance": 1000,
  ...
}
```

**Error Responses:**

- `400` - Invalid amount (must be positive)
- `404` - Wallet not found

---

### 3. Transfer Between Wallets

**Endpoint:** `POST /wallets/transfer`

**Request Body:**

```json
{
  "fromWalletId": "user-123",
  "toWalletId": "user-456",
  "amount": 250,
  "reference": "Payment for services",
  "idempotencyKey": "transfer-unique-123"
}
```

**Success Response (200):**

```json
{
  "sender": {
    "id": "user-123",
    "balance": 750,
    ...
  },
  "receiver": {
    "id": "user-456",
    "balance": 250,
    ...
  }
}
```

**Error Responses:**

- `400` - Insufficient balance / Invalid request
- `404` - Sender or receiver wallet not found

---

### 4. Get Wallet Details

**Endpoint:** `GET /wallets/:id`

**Success Response (200):**

```json
{
  "wallet": {
    "id": "user-123",
    "currency": "USD",
    "balance": 750,
    ...
  },
  "transactions": [
    {
      "walletId": "user-123",
      "type": "TRANSFER_OUT",
      "amount": -250,
      "toWalletId": "user-456",
      "balanceAfter": 750,
      "reference": "Payment",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "walletId": "user-123",
      "type": "FUND",
      "amount": 1000,
      "balanceAfter": 1000,
      "reference": "Initial deposit",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Error Responses:**

- `404` - Wallet not found

---

## Validation Rules

### Create Wallet

- `id`: Required, must be a non-empty string
- `currency`: Optional, defaults to "USD"
- `balance`: Optional, must be >= 0, defaults to 0

### Fund Wallet

- `amount`: Required, must be a positive number
- `reference`: Optional string
- `idempotencyKey`: Optional string (recommended for production)

### Transfer

- `fromWalletId`: Required, non-empty string
- `toWalletId`: Required, non-empty string
- `amount`: Required, positive number
- `reference`: Optional string
- `idempotencyKey`: Optional string (recommended for production)

## Idempotency

The service supports idempotency for fund and transfer operations. Include an `idempotencyKey` in your request to ensure the same operation isn't processed twice:

```json
{
  "amount": 100,
  "idempotencyKey": "unique-operation-id-123"
}
```

If you retry the same request with the same key, the operation will not be duplicated.

## Testing with Postman

See the included `Postman API Test Examples` artifact for detailed testing instructions and sample requests.

Quick test sequence:

1. Create two wallets
2. Fund both wallets
3. Transfer between wallets
4. Check transaction history
5. Test error cases (insufficient balance, invalid amounts, etc.)

## Database Schema

### Wallet Collection

```typescript
{
  id: string (unique)
  currency: string (default: 'USD')
  balance: number (min: 0)
  createdAt: Date
  updatedAt: Date
}
```

### Transaction Collection

```typescript
{
  walletId: string
  type: 'FUND' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  amount: number
  fromWalletId?: string
  toWalletId?: string
  idempotencyKey?: string
  balanceAfter: number
  reference?: string
  createdAt: Date
  updatedAt: Date
}
```

## Production Considerations

See `Production Scaling Notes` artifact for comprehensive scaling strategy including:

- Database transactions and race condition handling
- Caching strategy with Redis
- Horizontal scaling architecture
- Monitoring and observability
- Security enhancements
- Disaster recovery

## License

MIT
