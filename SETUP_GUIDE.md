# SplitIt - Complete Setup Guide

## 🎯 Current Status
✅ Backend server running on http://localhost:3000
✅ Environment variables configured
✅ dotenv installed and working

## 📋 Next Steps

### Step 1: Database Setup

Open a **NEW terminal** (keep the server running) and run:

```bash
cd "C:\All MERN STACK PROJECT\splitit\server"
npm run db:migrate
```

This creates all database tables (Users, Groups, Expenses, Settlements, etc.)

**Optional - Add test data:**
```bash
npm run db:seed
```

Creates sample users:
- Email: `alice@example.com` / Password: `password123`
- Email: `bob@example.com` / Password: `password123`

---

### Step 2: Generate OpenAPI Spec

```bash
npm run generate:openapi
```

Creates `server/openapi.json` from your API routes.

---

### Step 3: Generate Dart API Client

```bash
npm run generate:dart-client
```

Generates type-safe Dart client in `mobile/lib/api/` directory.

---

### Step 4: Setup Flutter App

```bash
cd "C:\All MERN STACK PROJECT\splitit\mobile"
flutter pub get
```

Generate Freezed models and JSON serialization:

```bash
dart run build_runner build --delete-conflicting-outputs
```

---

### Step 5: Run Flutter App

#### Option A: Test on Chrome (Web)

API URL localhost:3000 works directly:

```bash
flutter run -d chrome
```

#### Option B: Test on Android Emulator

1. Start Android Emulator from Android Studio
2. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

3. Update Flutter API URL:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://YOUR_IP:3000 --dart-define=SOCKET_URL=http://YOUR_IP:3000
   ```

   Example:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://192.168.1.100:3000 --dart-define=SOCKET_URL=http://192.168.1.100:3000
   ```

#### Option C: Test on Physical Android Device

Same as Option B - use your computer's IP address, ensure both devices are on the same WiFi network.

---

## 🧪 Testing the App

### 1. Register a New User
- Open app → Register screen
- Enter: Name, Email, Password
- Click Register

### 2. Create a Group
- After login → Groups tab
- Click "+" button
- Enter group name (e.g., "Roommates")
- Click Create

### 3. Add an Expense
- Open the group
- Click "Add Expense"
- Enter: Description, Amount
- Select who paid and how to split
- Click Save

### 4. View Balances
- Go to Balances tab
- See who owes whom
- Click "Settle Up" to record payments

---

## 🔍 Verify Everything is Working

### Check Backend Health

Open in browser: http://localhost:3000/health

Should return:
```json
{
  "status": "ok",
  "timestamp": "2026-10-01T17:33:44.123Z"
}
```

### Check API Endpoints

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice@example.com\",\"password\":\"password123\"}"
```

Should return a JWT token.

---

## 🐛 Troubleshooting

### Server won't start
- Check `.env` file exists in `server/` directory
- Verify DATABASE_URL is set
- Check if port 3000 is already in use: `netstat -ano | findstr :3000`

### Database errors
- Make sure you ran `npm run db:migrate`
- Check database connection string is correct
- Try SQLite instead: Change DATABASE_URL to `file:./dev.db`

### Flutter build errors
- Run `flutter clean` then `flutter pub get`
- Run `dart run build_runner clean` then `dart run build_runner build --delete-conflicting-outputs`
- Make sure you generated the Dart API client first

### API client not generated
- Check `server/openapi.json` exists (run `npm run generate:openapi`)
- Verify `@openapitools/openapi-generator-cli` is installed
- Check Java is installed (required by openapi-generator): `java -version`

### Android emulator can't connect to API
- Use your computer's IP address, not localhost
- Both devices must be on same network
- Check Windows Firewall allows port 3000

---

## 📱 App Features

### Implemented:
- ✅ User registration & login (email/password)
- ✅ JWT authentication with refresh tokens
- ✅ Create/edit/delete groups
- ✅ Add/remove group members
- ✅ Add/edit/delete expenses
- ✅ Multiple split types (equal, exact amounts, percentages)
- ✅ Balance calculations
- ✅ Settlement suggestions (who owes whom)
- ✅ Record settlements
- ✅ Real-time updates via Socket.io
- ✅ In-app notifications
- ✅ Group invitations via email
- ✅ Material 3 theme (light/dark mode)

### Optional (Not configured):
- ⚠️ Google Sign-In (requires GOOGLE_CLIENT_ID)
- ⚠️ Push notifications (requires OneSignal setup)
- ⚠️ Receipt uploads (requires S3 storage)
- ⚠️ Email notifications (requires SMTP)

---

## 🎨 Tech Stack

**Backend:**
- Express.js + TypeScript
- Prisma ORM
- PostgreSQL (or SQLite)
- Socket.io for real-time
- JWT authentication
- Zod validation

**Mobile:**
- Flutter 3.x
- Riverpod state management
- Material 3 design
- Dio + Retrofit for API
- Socket.io client
- flutter_secure_storage

---

## 📚 Project Structure

```
splitit/
├── server/               # Express backend
│   ├── src/
│   │   ├── controllers/  # Route handlers
│   │   ├── services/     # Business logic
│   │   ├── repositories/ # Database access
│   │   ├── middleware/   # Auth, validation, errors
│   │   ├── routes/       # API routes + validation schemas
│   │   ├── socket/       # Socket.io handlers
│   │   └── utils/        # Helpers (env, logger, etc.)
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── .env              # Environment variables
│
└── mobile/               # Flutter app
    ├── lib/
    │   ├── api/          # Generated API client
    │   ├── models/       # Data models
    │   ├── providers/    # Riverpod providers
    │   ├── screens/      # UI screens
    │   ├── widgets/      # Reusable widgets
    │   ├── theme/        # Material theme
    │   └── config/       # App configuration
    └── pubspec.yaml
```

---

## 🚀 Production Deployment

### Backend:
1. Set strong JWT secrets (32+ characters)
2. Use PostgreSQL (not SQLite)
3. Set NODE_ENV=production
4. Enable CORS for your domain only
5. Configure SMTP for emails
6. Set up S3/R2 for receipt storage
7. Deploy to: Railway, Render, Fly.io, AWS, etc.

### Mobile:
1. Build release APK: `flutter build apk --release`
2. Build iOS: `flutter build ipa --release`
3. Configure Google Sign-In (separate client IDs for Android/iOS)
4. Set up OneSignal for push notifications
5. Update API URLs to production
6. Submit to Play Store / App Store

---

## 🎉 You're All Set!

Follow the steps above in order, and you'll have a fully working expense-splitting app!

**Questions?** Check the troubleshooting section or review the code comments.
