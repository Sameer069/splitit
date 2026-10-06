/// App-wide configuration constants
class AppConfig {
  // ============================================================================
  // CONFIGURATION: Update these URLs for production deployment
  // ============================================================================
  
  // DEVELOPMENT URLs (localhost)
  static const String _devApiUrl = 'http://localhost:3000';
  static const String _devSocketUrl = 'http://localhost:3000';
  
  // PRODUCTION URLs - Render backend
  static const String _prodApiUrl = 'https://splitit-backend-w856.onrender.com';
  static const String _prodSocketUrl = 'https://splitit-backend-w856.onrender.com';
  
  // Environment flag - Set to true for production, false for development
  // Note: GitHub Actions will override apiBaseUrl/socketUrl with --dart-define
  static const bool _useProduction = false; // Keep false for local development
  
  // ============================================================================
  // API Configuration (automatically selects dev or prod based on flag above)
  // ============================================================================
  
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: _useProduction ? _prodApiUrl : _devApiUrl,
  );

  static const String socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: _useProduction ? _prodSocketUrl : _devSocketUrl,
  );

  // OneSignal Configuration
  static const String oneSignalAppId = String.fromEnvironment(
    'ONESIGNAL_APP_ID',
    defaultValue: '', // Set via --dart-define or leave empty for testing
  );

  // Google OAuth (Android & iOS client IDs set in platform-specific configs)
  static const String googleClientId = String.fromEnvironment(
    'GOOGLE_CLIENT_ID',
    defaultValue: '',
  );

  // Feature Flags
  static const bool enablePushNotifications = bool.fromEnvironment(
    'ENABLE_PUSH',
    defaultValue: true,
  );

  static const bool enableGoogleSignIn = bool.fromEnvironment(
    'ENABLE_GOOGLE_SIGNIN',
    defaultValue: true,
  );

  // App Metadata
  static const String appName = 'SplitIt';
  static const String appVersion = '1.0.0';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 50;

  // Validation
  static const int minPasswordLength = 8;
  static const int maxUploadSizeBytes = 10 * 1024 * 1024; // 10MB

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration socketTimeout = Duration(seconds: 10);

  // Storage Keys (for secure storage and shared preferences)
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';
  static const String darkModeKey = 'dark_mode';
  static const String pushTokenKey = 'push_token';

  // Deep Link Scheme
  static const String deepLinkScheme = 'splitwiseapp';
}
