import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../models/expense_models.dart';
import 'dio_provider.dart';

/// Expenses provider for a group
final expensesProvider =
    FutureProvider.family<List<Expense>, String>((ref, groupId) async {
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get(
      '${AppConfig.apiBaseUrl}/api/groups/$groupId/expenses',
    );
    final List<dynamic> data = response.data;
    return data.map((json) => Expense.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Failed to load expenses: $e');
  }
});

/// Single expense provider
final expenseProvider =
    FutureProvider.family<Expense, ({String groupId, String expenseId})>(
  (ref, params) async {
    final dio = ref.watch(dioProvider);

    try {
      final response = await dio.get(
        '${AppConfig.apiBaseUrl}/api/groups/${params.groupId}/expenses/${params.expenseId}',
      );
      return Expense.fromJson(response.data);
    } catch (e) {
      throw Exception('Failed to load expense: $e');
    }
  },
);

/// Expense actions (create, update, delete, comment)
class ExpensesNotifier extends StateNotifier<AsyncValue<void>> {
  final Dio _dio;

  ExpensesNotifier(this._dio) : super(const AsyncValue.data(null));

  /// Create new expense
  Future<Expense> createExpense(
    String groupId,
    CreateExpenseRequest request,
  ) async {
    state = const AsyncValue.loading();

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/expenses',
        data: request.toJson(),
      );

      state = const AsyncValue.data(null);
      return Expense.fromJson(response.data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Update expense
  Future<Expense> updateExpense(
    String groupId,
    String expenseId,
    UpdateExpenseRequest request,
  ) async {
    state = const AsyncValue.loading();

    try {
      final response = await _dio.patch(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/expenses/$expenseId',
        data: request.toJson(),
      );

      state = const AsyncValue.data(null);
      return Expense.fromJson(response.data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Delete expense
  Future<void> deleteExpense(String groupId, String expenseId) async {
    state = const AsyncValue.loading();

    try {
      await _dio.delete(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/expenses/$expenseId',
      );
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Add comment to expense
  Future<void> addComment(
    String groupId,
    String expenseId,
    AddCommentRequest request,
  ) async {
    state = const AsyncValue.loading();

    try {
      await _dio.post(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/expenses/$expenseId/comments',
        data: request.toJson(),
      );
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Delete comment
  Future<void> deleteComment(
    String groupId,
    String expenseId,
    String commentId,
  ) async {
    state = const AsyncValue.loading();

    try {
      await _dio.delete(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/expenses/$expenseId/comments/$commentId',
      );
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

/// Expenses notifier provider
final expensesNotifierProvider =
    StateNotifierProvider<ExpensesNotifier, AsyncValue<void>>((ref) {
  final dio = ref.watch(dioProvider);
  return ExpensesNotifier(dio);
});
