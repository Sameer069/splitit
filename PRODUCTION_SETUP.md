# SplitIt Production Setup Guide

## 🚀 Production Configuration

### 1. Environment Variables (.env)

#### Required for Production:
```env
NODE_ENV=production
PORT=3000

# Database - Use your Neon production URL
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# JWT Secrets - MUST CHANGE THESE!
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-production-jwt-secret-min-32-chars-use-crypto-random
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars-use-crypto-random
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

#### App URLs:

**APP_URL**: Your backend API URL (where the Express server is hosted)
- Examples:
  - Heroku: `https://splitit-api.herokuapp.com`
  - Vercel/Railway: `https://splitit-api.vercel.app`
  - Custom domain: `https://api.splitit.yourdomain.com`

**WEB_APP_URL**: Your frontend web app URL  
- Examples:
  - Vercel: `https://splitit.vercel.app`
  - Netlify: `https://splitit.netlify.app`
  - Custom domain: `https://splitit.yourdomain.com`

```env
APP_URL=https://api.splitit.yourdomain.com
WEB_APP_URL=https://splitit.yourdomain.com
```

#### Optional Services:

**Email (SMTP)** - For password reset emails
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@splitit.yourdomain.com
```

**Google OAuth** - For "Sign in with Google"
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://api.splitit.yourdomain.com/api/auth/google/callback` (production)

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

**Cloudinary** - For receipt image uploads
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get your credentials from Dashboard
3. (Optional) Create an upload preset for unsigned uploads:
   - Settings → Upload → Upload presets → Add upload preset
   - Set folder to `splitit/receipts`
   - Set signing mode to "Unsigned"

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_UPLOAD_PRESET=your-upload-preset (optional)
```

**OneSignal** - For push notifications (optional)
1. Sign up at [OneSignal](https://onesignal.com/)
2. Create a new app
3. Get your credentials from Settings → Keys & IDs

```env
ONESIGNAL_APP_ID=your-onesignal-app-id
ONESIGNAL_REST_API_KEY=your-onesignal-rest-api-key
```

#### Rate Limiting:
```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # 100 requests per window
```

---

## 📱 Flutter Mobile App Configuration

Update `mobile/lib/config/app_config.dart`:

```dart
class AppConfig {
  // DEVELOPMENT
  static const String apiBaseUrl = 'http://localhost:3000';
  static const String wsBaseUrl = 'ws://localhost:3000';
  
  // PRODUCTION - Update these!
  // static const String apiBaseUrl = 'https://api.splitit.yourdomain.com';
  // static const String wsBaseUrl = 'wss://api.splitit.yourdomain.com';
  
  // OneSignal App ID (if using push notifications)
  static const String? oneSignalAppId = 'YOUR_ONESIGNAL_APP_ID';
  
  // Google OAuth Client ID for Flutter
  static const String? googleClientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
}
```

---

## 🌐 Deployment Platforms

### Backend (Express.js)

**Option 1: Railway** (Recommended)
- Free tier available
- Automatic deployments from GitHub
- Built-in PostgreSQL
- Environment variables managed in dashboard

**Option 2: Render**
- Free tier with limitations
- Easy PostgreSQL integration
- Web service + database in one place

**Option 3: Heroku**
- Free tier discontinued, but still good for production
- Add Heroku Postgres add-on
- Configure environment variables in dashboard

**Option 4: Vercel** (Serverless)
- Free tier available
- Need to adapt for serverless (convert to API routes)
- Separate database hosting required

### Frontend (Flutter Web)

**Option 1: Vercel** (Recommended for web)
- Free tier
- Automatic deployments from GitHub
- Fast global CDN

**Option 2: Netlify**
- Free tier
- Drag-and-drop deployment
- Custom domain support

**Option 3: Firebase Hosting**
- Free tier
- Good integration with other Firebase services

### Mobile App

**Android**: Build APK and publish to Google Play Store
```bash
cd mobile
flutter build apk --release
```

**iOS**: Build and publish to Apple App Store
```bash
flutter build ios --release
```

---

## 🔐 Security Checklist

- [ ] Change JWT secrets to strong random values
- [ ] Enable HTTPS/SSL for production
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS to allow only your frontend domains
- [ ] Review and adjust rate limiting
- [ ] Enable database connection pooling
- [ ] Set up monitoring and error tracking (Sentry, LogRocket)
- [ ] Configure backup strategy for database
- [ ] Review and update `ALLOWED_ORIGINS` in CORS configuration

---

## 🧪 Testing Production Configuration

1. **Test backend health**:
   ```bash
   curl https://api.splitit.yourdomain.com/health
   ```

2. **Test authentication**:
   - Register a new user
   - Login with credentials
   - Test Google OAuth (if configured)

3. **Test file upload**:
   - Request upload signature from `/api/upload/presigned-url`
   - Upload image to Cloudinary
   - Verify image is accessible

4. **Test WebSocket connection**:
   - Join a group
   - Create an expense
   - Verify real-time updates work

---

## 📊 Monitoring

**Recommended Tools**:
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: Session replay and frontend monitoring  
- **Datadog/New Relic**: Infrastructure monitoring
- **Uptime Robot**: Uptime monitoring (free)

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database is accessible from your hosting platform
- Enable SSL mode: `?sslmode=require`

### CORS Errors
- Verify `WEB_APP_URL` matches your frontend domain
- Check CORS configuration in `server/src/index.ts`
- Ensure credentials are included in requests

### Image Upload Not Working
- Verify Cloudinary credentials are correct
- Check upload preset exists (if using unsigned uploads)
- Test upload signature generation endpoint

### WebSocket Connection Failed
- Verify WebSocket URL uses `wss://` (not `ws://`) in production
- Check firewall/proxy settings allow WebSocket connections
- Ensure backend supports WebSocket upgrades

---

## 📝 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [OneSignal Flutter SDK](https://documentation.onesignal.com/docs/flutter-sdk-setup)
- [Railway Deployment](https://docs.railway.app/)
- [Neon Database](https://neon.tech/docs/)

