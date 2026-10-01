import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../models/settlement_models.dart';
import 'dio_provider.dart';

/// Settlements provider for a group
final settlementsProvider =
    FutureProvider.family<List<Settlement>, String>((ref, groupId) async {
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get(
      '${AppConfig.apiBaseUrl}/api/groups/$groupId/settlements',
    );
    final List<dynamic> data = response.data;
    return data.map((json) => Settlement.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Failed to load settlements: $e');
  }
});

/// Settlement suggestions provider (simplified settlements)
final settlementSuggestionsProvider =
    FutureProvider.family<List<SettlementSuggestion>, String>(
  (ref, groupId) async {
    final dio = ref.watch(dioProvider);

    try {
      final response = await dio.get(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/settlements/suggestions',
      );
      final List<dynamic> data = response.data;
      return data.map((json) => SettlementSuggestion.fromJson(json)).toList();
    } catch (e) {
      throw Exception('Failed to load settlement suggestions: $e');
    }
  },
);

/// Settlement actions
class SettlementsNotifier extends StateNotifier<AsyncValue<void>> {
  final Dio _dio;

  SettlementsNotifier(this._dio) : super(const AsyncValue.data(null));

  /// Create settlement (mark as paid)
  Future<Settlement> createSettlement(
    String groupId,
    CreateSettlementRequest request,
  ) async {
    state = const AsyncValue.loading();

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/settlements',
        data: request.toJson(),
      );

      state = const AsyncValue.data(null);
      return Settlement.fromJson(response.data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

/// Settlements notifier provider
final settlementsNotifierProvider =
    StateNotifierProvider<SettlementsNotifier, AsyncValue<void>>((ref) {
  final dio = ref.watch(dioProvider);
  return SettlementsNotifier(dio);
});
