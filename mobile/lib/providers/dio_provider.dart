import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../services/storage_service.dart';
import 'auth_provider.dart';
import 'storage_provider.dart';

/// Auth interceptor for Dio
/// Automatically adds Bearer token to requests
/// Handles 401 responses by refreshing token
class AuthInterceptor extends Interceptor {
  final Ref ref;

  AuthInterceptor(this.ref);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Get current auth state
    final authState = ref.read(authProvider);

    // Add auth header if token exists
    if (authState.accessToken != null) {
      options.headers['Authorization'] = 'Bearer ${authState.accessToken}';
    }

    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle 401 Unauthorized - try to refresh token
    if (err.response?.statusCode == 401) {
      final authState = ref.read(authProvider);

      if (authState.refreshToken != null) {
        try {
          // Try to refresh token
          final dio = Dio(BaseOptions(baseUrl: AppConfig.apiBaseUrl));
          final response = await dio.post(
            '/api/auth/refresh',
            data: {'refreshToken': authState.refreshToken},
          );

          final newAccessToken = response.data['accessToken'] as String;
          final newRefreshToken = response.data['refreshToken'] as String;

          // Save new tokens
          final storage = ref.read(storageServiceProvider);
          await storage.saveAccessToken(newAccessToken);
          await storage.saveRefreshToken(newRefreshToken);

          // Update auth state
          ref.read(authProvider.notifier).updateUser();

          // Retry original request with new token
          final opts = err.requestOptions;
          opts.headers['Authorization'] = 'Bearer $newAccessToken';

          final response2 = await dio.fetch(opts);
          return handler.resolve(response2);
        } catch (e) {
          // Refresh failed - logout user
          await ref.read(authProvider.notifier).logout();
          return handler.reject(err);
        }
      }
    }

    handler.next(err);
  }
}

/// Logging interceptor for debugging
class LoggingInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    print('REQUEST[${options.method}] => PATH: ${options.path}');
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    print('RESPONSE[${response.statusCode}] => PATH: ${response.requestOptions.path}');
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    print('ERROR[${err.response?.statusCode}] => PATH: ${err.requestOptions.path}');
    handler.next(err);
  }
}

/// Dio provider with auth interceptor
/// All API calls should use this Dio instance
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.apiTimeout,
      receiveTimeout: AppConfig.apiTimeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ),
  );

  // Add interceptors
  dio.interceptors.add(AuthInterceptor(ref));
  
  // Only add logging in debug mode
  // ignore: dead_code
  if (false) { // Set to true for debugging
    dio.interceptors.add(LoggingInterceptor());
  }

  return dio;
});
