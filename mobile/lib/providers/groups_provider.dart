import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../models/group_models.dart';
import 'dio_provider.dart';

/// Groups provider - fetches user's groups
final groupsProvider = FutureProvider<List<Group>>((ref) async {
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get('${AppConfig.apiBaseUrl}/api/me/groups');
    final List<dynamic> data = response.data;
    return data.map((json) => Group.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Failed to load groups: $e');
  }
});

/// Single group provider
final groupProvider = FutureProvider.family<Group, String>((ref, groupId) async {
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get('${AppConfig.apiBaseUrl}/api/groups/$groupId');
    return Group.fromJson(response.data);
  } catch (e) {
    throw Exception('Failed to load group: $e');
  }
});

/// Group balances provider
final groupBalancesProvider =
    FutureProvider.family<List<GroupBalance>, String>((ref, groupId) async {
  final dio = ref.watch(dioProvider);

  try {
    final response = await dio.get('${AppConfig.apiBaseUrl}/api/groups/$groupId/balances');
    // Backend returns { balances: [...], suggestions: [...] }
    final Map<String, dynamic> data = response.data;
    final List<dynamic> balances = data['balances'];
    return balances.map((json) => GroupBalance.fromJson(json)).toList();
  } catch (e) {
    throw Exception('Failed to load balances: $e');
  }
});

/// Group actions (create, update, delete, manage members)
class GroupsNotifier extends StateNotifier<AsyncValue<void>> {
  final Dio _dio;

  GroupsNotifier(this._dio) : super(const AsyncValue.data(null));

  /// Create new group
  Future<Group> createGroup(CreateGroupRequest request) async {
    state = const AsyncValue.loading();

    try {
      final response = await _dio.post(
        '${AppConfig.apiBaseUrl}/api/groups',
        data: request.toJson(),
      );

      state = const AsyncValue.data(null);
      return Group.fromJson(response.data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Update group
  Future<Group> updateGroup(String groupId, UpdateGroupRequest request) async {
    state = const AsyncValue.loading();

    try {
      final response = await _dio.patch(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId',
        data: request.toJson(),
      );

      state = const AsyncValue.data(null);
      return Group.fromJson(response.data);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Delete group
  Future<void> deleteGroup(String groupId) async {
    state = const AsyncValue.loading();

    try {
      await _dio.delete('${AppConfig.apiBaseUrl}/api/groups/$groupId');
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Add member to group
  Future<void> addMember(String groupId, AddMemberRequest request) async {
    state = const AsyncValue.loading();

    try {
      await _dio.post(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/members',
        data: request.toJson(),
      );

      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Remove member from group
  Future<void> removeMember(String groupId, String userId) async {
    state = const AsyncValue.loading();

    try {
      await _dio.delete(
        '${AppConfig.apiBaseUrl}/api/groups/$groupId/members/$userId',
      );

      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }

  /// Leave group
  Future<void> leaveGroup(String groupId) async {
    state = const AsyncValue.loading();

    try {
      await _dio.post('${AppConfig.apiBaseUrl}/api/groups/$groupId/leave');
      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
      rethrow;
    }
  }
}

/// Groups notifier provider
final groupsNotifierProvider =
    StateNotifierProvider<GroupsNotifier, AsyncValue<void>>((ref) {
  final dio = ref.watch(dioProvider);
  return GroupsNotifier(dio);
});
