# SplitIt Mobile

**A complete Splitwise-style expense splitting app built with Flutter**

Cross-platform mobile app (Android, iOS, Web) with real-time synchronization, Material 3 design, and comprehensive expense management features.

## ✨ Features

### Core Functionality
- ✅ **Authentication**: Email/password + Google Sign-In with JWT tokens
- ✅ **Groups Management**: Create, edit, delete groups with member management
- ✅ **Expense Tracking**: Add expenses with custom splits and receipt uploads
- ✅ **Smart Balances**: Automatic balance calculation with simplified settlement suggestions
- ✅ **Real-time Sync**: Socket.io integration for instant updates across devices
- ✅ **Push Notifications**: OneSignal integration for expense and settlement alerts
- ✅ **Comments**: Discussion threads on expenses
- ✅ **Settlement History**: Track who paid whom and when

### Technical Features
- 📱 Cross-platform: Single codebase for Android, iOS, and Web
- 🎨 Material 3 design with light/dark themes
- 🔒 Secure token storage with encryption
- 🔄 Offline-ready architecture (coming soon)
- 📊 Type-safe API client generation from OpenAPI spec
- 🧪 Comprehensive error handling and validation

## 🏗️ Architecture

### Tech Stack
- **Framework**: Flutter 3.0+ (Dart 3.0+)
- **State Management**: Riverpod 2.6 with code generation
- **Navigation**: go_router 14.6 with deep linking
- **HTTP Client**: Dio 5.9 with Retrofit for type safety
- **Real-time**: Socket.io Client 3.1
- **Authentication**: Google Sign-In + JWT
- **Push Notifications**: OneSignal 5.2
- **Storage**: flutter_secure_storage + SharedPreferences
- **Code Generation**: Freezed for immutable models
- **Image Handling**: image_picker + cached_network_image

### Project Structure
```
mobile/lib/
├── config/          # App configuration
├── models/          # Data models (Freezed)
├── providers/       # Riverpod providers
├── router/          # Navigation (go_router)
├── screens/         # UI screens
│   ├── auth/        # Login, register, forgot password
│   ├── groups/      # Groups list, detail, manage
│   ├── expenses/    # Expenses list, detail, create/edit
│   ├── balances/    # Balance overview, settlements
│   ├── notifications/ # Notifications list
│   └── profile/     # Profile, settings
├── services/        # Business logic services
├── theme/           # Material 3 theming
├── utils/           # Utilities and helpers
└── widgets/         # Reusable components
```

## 🚀 Getting Started

### Prerequisites
- Flutter SDK 3.0.0 or higher
- Dart SDK 3.0.0 or higher
- Android Studio / Xcode (for mobile)
- Chrome (for web)
- Node.js (for backend API)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd splitit/mobile
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Generate code** (Freezed models, Riverpod providers)
   ```bash
   dart run build_runner build --delete-conflicting-outputs
   ```

4. **Generate API client** (from backend OpenAPI spec)
   ```bash
   cd ../server
   npm install
   npm run generate:dart-client
   ```

5. **Configure environment**
   
   Update `lib/config/app_config.dart` or use `--dart-define`:
   ```bash
   flutter run \
     --dart-define=API_BASE_URL=http://localhost:3000 \
     --dart-define=ONESIGNAL_APP_ID=your-onesignal-id
   ```

6. **Run the app**
   ```bash
   # Development
   flutter run

   # Specific device
   flutter devices
   flutter run -d chrome  # Web
   flutter run -d <device-id>  # Mobile
   ```

## 📱 Platform-Specific Setup

### Android
1. **Minimum SDK**: 21 (Android 5.0)
2. **Google Sign-In**: Add SHA-1 fingerprint to Firebase console
   ```bash
   cd android
   ./gradlew signingReport
   ```
3. **OneSignal**: Configure in `android/app/build.gradle`

### iOS
1. **Minimum**: iOS 12.0
2. **Google Sign-In**: Add URL scheme to `Info.plist`
3. **OneSignal**: Enable Push Notifications capability in Xcode
4. **TestFlight**: Register device UDIDs in Apple Developer portal

### Web
- Works out of the box with Chrome
- For production, deploy `build/web/` to any static hosting

## 🔨 Development

### Code Generation
Run after modifying Freezed/Riverpod annotated files:
```bash
# Watch mode (auto-rebuild)
dart run build_runner watch

# One-time build
dart run build_runner build --delete-conflicting-outputs
```

### Hot Reload
Press `r` in terminal for hot reload, `R` for full restart.

### Debugging
- Use Flutter DevTools for network inspection and performance profiling
- Enable logging in `dio_provider.dart` by setting debug flag

## 🏗️ Building for Production

### Android (APK/AAB)
```bash
# APK (for testing)
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

Output: `build/app/outputs/`

### iOS (IPA)
Requires Apple Developer account ($99/year):
```bash
flutter build ios --release
```

Then use Xcode to archive and upload to TestFlight.

### Web
```bash
flutter build web --release
```

Output: `build/web/`

Deploy to Vercel, Netlify, Firebase Hosting, or any static host.

## 🧪 Testing

### Run Tests
```bash
# All tests
flutter test

# With coverage
flutter test --coverage
```

### Widget Tests
```bash
flutter test test/widgets/
```

### Integration Tests
```bash
flutter test integration_test/
```

## 📚 API Integration

### Connecting to Backend
The app communicates with the Express.js backend via REST API and Socket.io.

1. **Start the backend server**
   ```bash
   cd server
   npm install
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```

2. **Generate API client**
   ```bash
   npm run generate:dart-client
   ```

3. **Update API URL**
   - Development: `http://localhost:3000` (default)
   - Android Emulator: `http://10.0.2.2:3000`
   - iOS Simulator: `http://localhost:3000`
   - Production: Update in `app_config.dart`

## 🔐 Environment Variables

Pass via `--dart-define`:

```bash
flutter run \
  --dart-define=API_BASE_URL=https://api.splitit.com \
  --dart-define=SOCKET_URL=https://api.splitit.com \
  --dart-define=ONESIGNAL_APP_ID=your-app-id \
  --dart-define=GOOGLE_CLIENT_ID=your-client-id \
  --dart-define=ENABLE_PUSH=true \
  --dart-define=ENABLE_GOOGLE_SIGNIN=true
```

Or create `.env` files (requires `flutter_dotenv`).

## 🐛 Troubleshooting

### Code Generation Issues
```bash
flutter clean
flutter pub get
dart run build_runner clean
dart run build_runner build --delete-conflicting-outputs
```

### API Connection Failed
- Verify backend is running: `curl http://localhost:3000/api/health`
- Check API URL in `app_config.dart`
- For Android emulator, use `10.0.2.2` instead of `localhost`

### Google Sign-In Not Working
- Verify SHA-1 fingerprint is in Firebase console
- Check `google-services.json` (Android) or `GoogleService-Info.plist` (iOS) exists
- Ensure OAuth client ID matches server config

### Push Notifications Not Received
- Check OneSignal App ID matches server
- Verify device token is registered: `POST /api/push-tokens`
- Test with OneSignal dashboard first
- Check notification permissions are granted

### Socket.io Connection Issues
- Verify Socket URL is correct
- Check JWT token is valid
- Ensure WebSocket is not blocked by firewall
- Enable socket logging in `socket_provider.dart`

## 📖 Documentation

- [API Client Generation](API_CLIENT_GENERATION.md)
- [Socket.io Integration](SOCKET_INTEGRATION_GUIDE.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)

## 🎨 Design System

### Colors
- **Primary**: Indigo (#4F46E5)
- **Success**: Green (#16A34A) - Positive balances
- **Danger**: Red (#DC2626) - Negative balances, delete actions
- **Warning**: Amber (#F59E0B) - Pending items
- **Info**: Sky Blue (#0EA5E9)

### Typography
- Display: 32-24px (Headlines)
- Title: 20-16px (Section headers)
- Body: 16-12px (Content)

### Spacing
- Base unit: 4px
- Common: 8px, 12px, 16px, 24px, 32px

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style
- Follow [Effective Dart](https://dart.dev/guides/language/effective-dart) guidelines
- Use `dart format` before committing
- Run `flutter analyze` to check for issues
- Write tests for new features

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Built with [Flutter](https://flutter.dev/)
- State management by [Riverpod](https://riverpod.dev/)
- Icons from [Material Icons](https://fonts.google.com/icons)
- Push notifications by [OneSignal](https://onesignal.com/)

## 📞 Support

- Documentation: Check guides in `/mobile` directory
- Issues: Open an issue on GitHub
- Email: support@splitit.com

---

**Built with ❤️ using Flutter**
