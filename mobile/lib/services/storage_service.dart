import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

/// Secure storage service for sensitive data (tokens, credentials)
/// Uses flutter_secure_storage which encrypts data at rest
class StorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _prefs;

  StorageService(this._secureStorage, this._prefs);

  // ==================== Secure Storage (Encrypted) ====================

  /// Save access token (encrypted)
  Future<void> saveAccessToken(String token) async {
    await _secureStorage.write(
      key: AppConfig.accessTokenKey,
      value: token,
    );
  }

  /// Get access token
  Future<String?> getAccessToken() async {
    return await _secureStorage.read(key: AppConfig.accessTokenKey);
  }

  /// Save refresh token (encrypted)
  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(
      key: AppConfig.refreshTokenKey,
      value: token,
    );
  }

  /// Get refresh token
  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConfig.refreshTokenKey);
  }

  /// Save user ID
  Future<void> saveUserId(String userId) async {
    await _secureStorage.write(
      key: AppConfig.userIdKey,
      value: userId,
    );
  }

  /// Get user ID
  Future<String?> getUserId() async {
    return await _secureStorage.read(key: AppConfig.userIdKey);
  }

  /// Clear all secure storage (logout)
  Future<void> clearSecureStorage() async {
    await _secureStorage.deleteAll();
  }

  // ==================== Shared Preferences (Non-sensitive) ====================

  /// Save dark mode preference
  Future<void> saveDarkMode(bool isDark) async {
    await _prefs.setBool(AppConfig.darkModeKey, isDark);
  }

  /// Get dark mode preference (null = system default)
  bool? getDarkMode() {
    return _prefs.getBool(AppConfig.darkModeKey);
  }

  /// Save push notification token
  Future<void> savePushToken(String token) async {
    await _prefs.setString(AppConfig.pushTokenKey, token);
  }

  /// Get push notification token
  String? getPushToken() {
    return _prefs.getString(AppConfig.pushTokenKey);
  }

  /// Clear all preferences
  Future<void> clearPreferences() async {
    await _prefs.clear();
  }

  /// Clear all storage (secure + preferences)
  Future<void> clearAll() async {
    await Future.wait([
      clearSecureStorage(),
      clearPreferences(),
    ]);
  }
}
