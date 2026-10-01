import 'package:freezed_annotation/freezed_annotation.dart';

part 'socket_state.freezed.dart';

/// Socket connection state
@freezed
class SocketState with _$SocketState {
  const factory SocketState({
    @Default(false) bool isConnected,
    @Default(false) bool isConnecting,
    @Default({}) Set<String> joinedGroups,
    SocketEvent? lastEvent,
    String? error,
    @Default(0) int unreadNotifications,
  }) = _SocketState;
}

/// Socket event types
/// Matches server's SocketEvents class
enum SocketEventType {
  // Expenses
  expenseCreated,
  expenseUpdated,
  expenseDeleted,

  // Comments
  commentAdded,
  commentDeleted,

  // Settlements
  settlementCreated,

  // Balances
  balancesUpdated,

  // Members
  memberJoined,
  memberLeft,

  // Invites
  inviteAccepted,

  // Groups
  groupUpdated,

  // Notifications
  notificationNew,
}

/// Socket event data
@freezed
class SocketEvent with _$SocketEvent {
  const factory SocketEvent({
    required SocketEventType type,
    required Map<String, dynamic> data,
    required DateTime timestamp,
  }) = _SocketEvent;
}
