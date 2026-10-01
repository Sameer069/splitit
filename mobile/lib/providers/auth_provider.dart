import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../config/app_config.dart';
import '../models/auth_state.dart';
import '../services/storage_service.dart';
import 'storage_provider.dart';

/// Auth state notifier - manages authentication state
class AuthNotifier extends StateNotifier<AuthState> {
  final StorageService _storage;
  final Dio _dio;

  AuthNotifier(this._storage, this._dio) : super(const AuthState()) {
    _initialize();
  }

  /// Initialize auth state from storage
  Future<void> _initialize() async {
    state = state.copyWith(isLoading: true);

    try {
      final accessToken = await _storage.getAccessToken();
      final refreshToken = await _storage.getRefreshToken();
      final userId = await _storage.getUserId();

      if (accessToken != null && refreshToken != null && userId != null) {
        // Tokens exist - verify with backend
        await _verifyToken(accessToken, refreshToken, userId);
      } else {
        // No tokens - user not logged in
        state = state.copyWith(isLoading: false, isAuthenticated: false);
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        isAuthenticated: false,
        error: 'Failed to initialize auth: $e',
      );
    }
  }

  /// Verify access token is still valid
  Future<void> _verifyToken(
    String accessToken,
    String refreshToken,
    String userId,
  ) async {
    try {
      // Try to fetch current user profile to verify token
      final response = await _dio.get(
        '${AppConfig.apiBaseUrl}/api/users/me',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      final user = User.fromJson(response.data);

      state = state.copyWith(
        accessToken: accessToken,
        refreshToken: refreshToken,
        userId: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      // Token invalid or expired - try to refresh
      if (e is DioException && e.response?.statusCode == 401) {
        await _refreshAccessToken(refreshToken);
      } else {
        // Other error - clear auth
        await logout();
      }
    }
  }

  /// Refresh access token using refresh token
  Future<void> _refreshAccessToken(String refreshToken) async {
    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      final newAccessToken = response.data['accessToken'] as String;
      final newRefreshToken = response.data['refreshToken'] as String;

      await _storage.saveAccessToken(newAccessToken);
      await _storage.saveRefreshToken(newRefreshToken);

      state = state.copyWith(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      // Refresh failed - logout
      await logout();
    }
  }

  /// Login with email and password
  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Save tokens
      await _storage.saveAccessToken(loginResponse.accessToken);
      await _storage.saveRefreshToken(loginResponse.refreshToken);
      await _storage.saveUserId(loginResponse.user.id);

      state = state.copyWith(
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        userId: loginResponse.user.id,
        email: loginResponse.user.email,
        name: loginResponse.user.name,
        avatarUrl: loginResponse.user.avatarUrl,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      String errorMessage = 'Login failed';
      if (e is DioException) {
        errorMessage = e.response?.data['message'] ?? errorMessage;
      }

      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      rethrow;
    }
  }

  /// Register new user
  Future<void> register(String name, String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
        },
      );

      final registerResponse = RegisterResponse.fromJson(response.data);

      // Save tokens
      await _storage.saveAccessToken(registerResponse.accessToken);
      await _storage.saveRefreshToken(registerResponse.refreshToken);
      await _storage.saveUserId(registerResponse.user.id);

      state = state.copyWith(
        accessToken: registerResponse.accessToken,
        refreshToken: registerResponse.refreshToken,
        userId: registerResponse.user.id,
        email: registerResponse.user.email,
        name: registerResponse.user.name,
        avatarUrl: registerResponse.user.avatarUrl,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      String errorMessage = 'Registration failed';
      if (e is DioException) {
        errorMessage = e.response?.data['message'] ?? errorMessage;
      }

      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      rethrow;
    }
  }

  /// Login with Google (using ID token from google_sign_in)
  Future<void> loginWithGoogle(String idToken) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/auth/google',
        data: {
          'idToken': idToken,
        },
      );

      final loginResponse = LoginResponse.fromJson(response.data);

      // Save tokens
      await _storage.saveAccessToken(loginResponse.accessToken);
      await _storage.saveRefreshToken(loginResponse.refreshToken);
      await _storage.saveUserId(loginResponse.user.id);

      state = state.copyWith(
        accessToken: loginResponse.accessToken,
        refreshToken: loginResponse.refreshToken,
        userId: loginResponse.user.id,
        email: loginResponse.user.email,
        name: loginResponse.user.name,
        avatarUrl: loginResponse.user.avatarUrl,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      String errorMessage = 'Google sign-in failed';
      if (e is DioException) {
        errorMessage = e.response?.data['message'] ?? errorMessage;
      }

      state = state.copyWith(
        isLoading: false,
        error: errorMessage,
      );
      rethrow;
    }
  }

  /// Logout
  Future<void> logout() async {
    // Clear storage
    await _storage.clearAll();

    // Reset state
    state = const AuthState(isAuthenticated: false);
  }

  /// Update user profile (after edit)
  void updateUser({
    String? name,
    String? email,
    String? avatarUrl,
  }) {
    state = state.copyWith(
      name: name ?? state.name,
      email: email ?? state.email,
      avatarUrl: avatarUrl ?? state.avatarUrl,
    );
  }
}

/// Auth provider
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final storage = ref.watch(storageServiceProvider);
  final dio = Dio(); // Basic dio without auth interceptor
  return AuthNotifier(storage, dio);
});
