/// Socket connection state
class SocketState {
  final bool isConnected;
  final bool isConnecting;
  final Set<String> joinedGroups;
  final SocketEvent? lastEvent;
  final String? error;
  final int unreadNotifications;

  const SocketState({
    this.isConnected = false,
    this.isConnecting = false,
    this.joinedGroups = const {},
    this.lastEvent,
    this.error,
    this.unreadNotifications = 0,
  });

  SocketState copyWith({
    bool? isConnected,
    bool? isConnecting,
    Set<String>? joinedGroups,
    SocketEvent? lastEvent,
    String? error,
    int? unreadNotifications,
  }) {
    return SocketState(
      isConnected: isConnected ?? this.isConnected,
      isConnecting: isConnecting ?? this.isConnecting,
      joinedGroups: joinedGroups ?? this.joinedGroups,
      lastEvent: lastEvent ?? this.lastEvent,
      error: error ?? this.error,
      unreadNotifications: unreadNotifications ?? this.unreadNotifications,
    );
  }
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
class SocketEvent {
  final SocketEventType type;
  final Map<String, dynamic> data;
  final DateTime timestamp;

  const SocketEvent({
    required this.type,
    required this.data,
    required this.timestamp,
  });
}
