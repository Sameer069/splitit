# SplitIt Server

Express + TypeScript + Prisma + Socket.io backend for the SplitIt expense splitting app.

## Tech Stack

- **Node.js** + **Express** (TypeScript, strict mode)
- **Prisma ORM** with PostgreSQL
- **Socket.io** for real-time updates
- **JWT** authentication (access + refresh tokens)
- **Zod** for request validation
- **Google OAuth** for Sign-In
- **OneSignal** for push notifications
- **Nodemailer** for emails
- **S3-compatible storage** for receipt uploads

## Prerequisites

- Node.js 18+ (or 20+ recommended)
- PostgreSQL database (local or cloud - Neon.tech / Supabase free tier)
- Google OAuth Client ID (from Google Cloud Console)
- OneSignal App ID and REST API Key (from onesignal.com)
- (Optional) S3-compatible storage for receipt uploads

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

**Required environment variables:**

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/splitwise"

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"

# OneSignal
ONESIGNAL_APP_ID="your-onesignal-app-id"
ONESIGNAL_REST_API_KEY="your-onesignal-rest-api-key"

# Email (for password reset & invites)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Storage (optional - for receipt photos)
S3_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed initial data (expense categories)
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

- API: `http://localhost:3000/api`
- Health check: `http://localhost:3000/health`
- Socket.io: `ws://localhost:3000` (auto-connects on same port)

## Project Structure

```
server/
├── src/
│   ├── routes/              # API route definitions
│   │   └── validation/       # Zod schemas for request validation
│   ├── middleware/           # Auth, validation, error handling
│   ├── controllers/          # Request handlers (thin layer)
│   ├── services/             # Business logic
│   ├── repositories/         # Database operations (Prisma)
│   ├── socket/               # Socket.io setup & real-time events
│   ├── openapi/              # OpenAPI spec generation
│   ├── utils/                # Helpers (JWT, password, logger, etc.)
│   ├── types/                # TypeScript type extensions
│   └── index.ts              # App entry point
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed data
├── .env                      # Environment variables (gitignored)
├── .env.example              # Template
├── package.json
└── tsconfig.json
```

## Architecture

### Layered Architecture

```
Routes → Middleware → Controllers → Services → Repositories (Prisma)
```

- **Routes**: Define endpoints + apply middleware stack
- **Middleware**: Auth, permissions, validation (composable)
- **Controllers**: Parse requests, call services, return responses
- **Services**: Business logic, orchestration
- **Repositories**: Database queries only (single source of Prisma calls)

### Authorization Middleware Stack

```typescript
// Example: Update expense (requires membership + permission)
router.patch(
  '/groups/:id/expenses/:expenseId',
  authenticate,                      // Verify JWT
  requireGroupMembership,            // Check user is in group
  requireExpenseModifyPermission,    // Check creator OR owner
  validateBody(updateExpenseSchema), // Validate request
  expenseController.update
);
```

See `MIDDLEWARE_GUIDE.md` for full middleware documentation.

### Real-time Updates

**Socket.io** handles all real-time sync:

1. Client connects with JWT token
2. Server authenticates and joins user to:
   - Personal room: `user:{userId}` (for notifications)
   - Group rooms: `group:{groupId}` (for each group they're in)
3. Services emit events after DB operations:
   - `expense:created`, `expense:updated`, `expense:deleted`
   - `balance:updated`
   - `member:joined`, `member:left`
   - `settlement:created`
   - `notification:new`
4. Clients listening on these events update UI instantly

**No manual refresh anywhere in the app** - everything is real-time.

## API Endpoints

### Authentication

```
POST   /api/auth/register          # Email/password registration
POST   /api/auth/login             # Email/password login
POST   /api/auth/google            # Google Sign-In (ID token verification)
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Revoke refresh token
POST   /api/auth/forgot-password   # Request password reset email
POST   /api/auth/reset-password    # Reset password with token
PATCH  /api/auth/change-password   # Change password (authenticated)
```

### User

```
GET    /api/me                     # Get current user
PATCH  /api/me                     # Update profile
GET    /api/me/groups              # List user's groups
```

### Groups

```
POST   /api/groups                        # Create group
GET    /api/groups/:id                    # Get group details
PATCH  /api/groups/:id                    # Update group (owner only)
DELETE /api/groups/:id                    # Delete group (owner only)
POST   /api/groups/:id/members            # Add member by email
DELETE /api/groups/:id/members/:userId    # Remove member (owner only)
DELETE /api/groups/:id/members/me         # Leave group
POST   /api/groups/:id/transfer-ownership # Transfer ownership
```

### Expenses

```
GET    /api/categories                                 # List categories
POST   /api/groups/:id/expenses                        # Create expense
GET    /api/groups/:id/expenses                        # List expenses (paginated)
GET    /api/groups/:id/expenses/:expenseId             # Get expense detail
PATCH  /api/groups/:id/expenses/:expenseId             # Update expense
DELETE /api/groups/:id/expenses/:expenseId             # Delete expense
POST   /api/groups/:id/expenses/:expenseId/comments    # Add comment
DELETE /api/groups/:id/expenses/:expenseId/comments/:commentId  # Delete comment
GET    /api/groups/:id/expenses/:expenseId/history     # Get audit log
```

### Balances & Settlements

```
GET    /api/groups/:id/balances           # Get balances + simplified settlements
POST   /api/groups/:id/settlements        # Record a settlement
GET    /api/groups/:id/settlements        # List settlement history
```

### Invites

```
POST   /api/groups/:id/invites            # Create & send invite
GET    /api/groups/:id/invites            # List group invites
GET    /api/invites/pending               # Get pending invites for current user
GET    /api/invites/:token                # Preview invite (public)
POST   /api/invites/:token/accept         # Accept invite
```

### Notifications

```
GET    /api/notifications                 # List notifications (paginated)
GET    /api/notifications/unread-count    # Get unread count
PATCH  /api/notifications/:id/read        # Mark as read
PATCH  /api/notifications/read-all        # Mark all as read
POST   /api/push-tokens                   # Register push token
DELETE /api/push-tokens/:token            # Unregister push token
```

### Upload

```
POST   /api/upload/presigned-url          # Get pre-signed URL for receipt upload
```

## Scripts

```bash
# Development
npm run dev              # Start with hot-reload

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes (no migration)
npm run db:migrate       # Create and run migration
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed initial data

# OpenAPI & Dart Client
npm run generate:openapi       # Generate openapi.json
npm run generate:dart-client   # Generate Dart/Dio client for Flutter

# Production
npm run build            # Compile TypeScript
npm start                # Run compiled code

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier
```

## Deployment

### Environment Setup

1. **Database**: Provision PostgreSQL (Neon.tech / Supabase / AWS RDS)
2. **Server**: Deploy to Render.com / Railway / Heroku
3. **Environment**: Set all `.env` variables in hosting platform

### Build & Start

```bash
npm run build
npm start
```

### Database Migrations

Run migrations before starting:

```bash
npm run db:migrate
npm run db:seed
```

## Testing

### Manual API Testing

Use the `/health` endpoint to verify the server is running:

```bash
curl http://localhost:3000/health
```

### Testing Real-time Events

1. Open two browser tabs with the mobile app
2. Log in as different users in the same group
3. Create an expense in one tab → see it appear instantly in the other
4. No refresh required anywhere

## Security

- **JWT**: Short-lived access tokens (15min) + long-lived refresh tokens (7 days)
- **Refresh token rotation**: New token issued on every refresh
- **Password hashing**: bcrypt with 12 salt rounds
- **Rate limiting**: Applied to auth endpoints (5 attempts / 15 min)
- **Helmet**: Security headers on all responses
- **Input validation**: Zod schemas on every endpoint
- **Authorization**: Middleware enforces all permissions server-side

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
npm run db:studio
```

If connection fails, verify `DATABASE_URL` in `.env`.

### Socket.io Not Connecting

- Check CORS config in `src/index.ts`
- Verify JWT token is being sent in Socket.io handshake
- Check browser console for WebSocket errors

### Google Sign-In Fails

- Verify `GOOGLE_CLIENT_ID` matches your OAuth client
- Check that `google-auth-library` is installed
- Ensure ID token is being sent from client correctly

### Push Notifications Not Sending

- Verify OneSignal credentials in `.env`
- Check that user has registered a push token (`POST /api/push-tokens`)
- Push only sends to users NOT connected via Socket.io (by design)

### Email Not Sending

- Test SMTP credentials
- For Gmail: use an App Password, not your real password
- Check logs for email service errors

## License

MIT
