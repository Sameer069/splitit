import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../config/app_config.dart';
import '../models/socket_state.dart';
import '../models/auth_state.dart';
import 'auth_provider.dart';

/// Socket.io provider with JWT authentication and real-time event handling
/// Automatically connects/disconnects based on auth state
/// Manages group room subscriptions
class SocketNotifier extends StateNotifier<SocketState> {
  final Ref ref;
  io.Socket? _socket;

  SocketNotifier(this.ref) : super(const SocketState()) {
    // Listen to auth state changes
    ref.listen<AuthState>(
      authProvider,
      (previous, next) {
        if (next.isAuthenticated && next.accessToken != null) {
          // User logged in - connect socket
          _connect(next.accessToken!);
        } else if (previous?.isAuthenticated == true && !next.isAuthenticated) {
          // User logged out - disconnect socket
          _disconnect();
        }
      },
    );
  }

  /// Connect to Socket.io server with JWT authentication
  void _connect(String accessToken) {
    if (_socket != null && _socket!.connected) {
      return; // Already connected
    }

    state = state.copyWith(
      isConnecting: true,
      error: null,
    );

    _socket = io.io(
      AppConfig.socketUrl,
      io.OptionBuilder()
          .setTransports(['websocket']) // Use WebSocket only (no polling)
          .disableAutoConnect() // Manual connection control
          .setAuth({'token': accessToken}) // JWT in auth handshake
          .setReconnectionDelay(1000)
          .setReconnectionDelayMax(5000)
          .enableReconnection()
          .build(),
    );

    // Connection successful
    _socket!.onConnect((_) {
      print('[Socket] Connected');
      state = state.copyWith(
        isConnected: true,
        isConnecting: false,
        error: null,
      );
      
      // Re-join all active group rooms
      _rejoinRooms();
    });

    // Connection error
    _socket!.onConnectError((error) {
      print('[Socket] Connection error: $error');
      state = state.copyWith(
        isConnected: false,
        isConnecting: false,
        error: 'Connection failed: $error',
      );
    });

    // Disconnected
    _socket!.onDisconnect((reason) {
      print('[Socket] Disconnected: $reason');
      state = state.copyWith(
        isConnected: false,
        isConnecting: false,
      );
    });

    // Generic error
    _socket!.on('error', (error) {
      print('[Socket] Error: $error');
      state = state.copyWith(
        error: error.toString(),
      );
    });

    // Authentication error (401)
    _socket!.on('unauthorized', (error) {
      print('[Socket] Unauthorized: $error');
      state = state.copyWith(
        isConnected: false,
        isConnecting: false,
        error: 'Authentication failed',
      );
      // Trigger token refresh in auth provider
      ref.read(authProvider.notifier).logout();
    });

    // Register event listeners
    _registerEventListeners();

    // Connect
    _socket!.connect();
  }

  /// Disconnect from Socket.io server
  void _disconnect() {
    if (_socket != null) {
      _socket!.disconnect();
      _socket!.dispose();
      _socket = null;
    }

    state = const SocketState();
  }

  /// Join a group room for real-time updates
  void joinGroup(String groupId) {
    if (_socket == null || !_socket!.connected) {
      print('[Socket] Cannot join group: not connected');
      return;
    }

    _socket!.emit('join-group', groupId);
    
    state = state.copyWith(
      joinedGroups: {...state.joinedGroups, groupId},
    );
    
    print('[Socket] Joined group: $groupId');
  }

  /// Leave a group room
  void leaveGroup(String groupId) {
    if (_socket == null || !_socket!.connected) {
      return;
    }

    _socket!.emit('leave-group', groupId);
    
    final updatedGroups = Set<String>.from(state.joinedGroups)..remove(groupId);
    state = state.copyWith(joinedGroups: updatedGroups);
    
    print('[Socket] Left group: $groupId');
  }

  /// Rejoin all rooms after reconnection
  void _rejoinRooms() {
    for (final groupId in state.joinedGroups) {
      _socket!.emit('join-group', groupId);
      print('[Socket] Rejoined group: $groupId');
    }
  }

  /// Register all Socket.io event listeners
  void _registerEventListeners() {
    if (_socket == null) return;

    // ==================== Expense Events ====================
    
    _socket!.on('expense:created', (data) {
      print('[Socket] Expense created: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.expenseCreated,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    _socket!.on('expense:updated', (data) {
      print('[Socket] Expense updated: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.expenseUpdated,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    _socket!.on('expense:deleted', (data) {
      print('[Socket] Expense deleted: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.expenseDeleted,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Comment Events ====================
    
    _socket!.on('comment:added', (data) {
      print('[Socket] Comment added: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.commentAdded,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    _socket!.on('comment:deleted', (data) {
      print('[Socket] Comment deleted: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.commentDeleted,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Settlement Events ====================
    
    _socket!.on('settlement:created', (data) {
      print('[Socket] Settlement created: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.settlementCreated,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Balance Events ====================
    
    _socket!.on('balances:updated', (data) {
      print('[Socket] Balances updated for group: ${data['groupId']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.balancesUpdated,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Member Events ====================
    
    _socket!.on('member:joined', (data) {
      print('[Socket] Member joined: ${data['userId']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.memberJoined,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    _socket!.on('member:left', (data) {
      print('[Socket] Member left: ${data['userId']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.memberLeft,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Invite Events ====================
    
    _socket!.on('invite:accepted', (data) {
      print('[Socket] Invite accepted: ${data['inviteId']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.inviteAccepted,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Group Events ====================
    
    _socket!.on('group:updated', (data) {
      print('[Socket] Group updated: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.groupUpdated,
          data: data,
          timestamp: DateTime.now(),
        ),
      );
    });

    // ==================== Notification Events ====================
    
    _socket!.on('notification:new', (data) {
      print('[Socket] New notification: ${data['id']}');
      state = state.copyWith(
        lastEvent: SocketEvent(
          type: SocketEventType.notificationNew,
          data: data,
          timestamp: DateTime.now(),
        ),
        unreadNotifications: state.unreadNotifications + 1,
      );
    });
  }

  /// Clear error
  void clearError() {
    state = state.copyWith(error: null);
  }

  /// Mark notification as read (decrement counter)
  void markNotificationRead() {
    if (state.unreadNotifications > 0) {
      state = state.copyWith(
        unreadNotifications: state.unreadNotifications - 1,
      );
    }
  }

  /// Reset unread notifications counter
  void resetUnreadNotifications() {
    state = state.copyWith(unreadNotifications: 0);
  }

  @override
  void dispose() {
    _disconnect();
    super.dispose();
  }
}

/// Socket provider
final socketProvider = StateNotifierProvider<SocketNotifier, SocketState>((ref) {
  return SocketNotifier(ref);
});

/// Helper provider to get specific event type stream
/// Usage: ref.listen(socketEventProvider(SocketEventType.expenseCreated), (prev, next) {})
final socketEventProvider = Provider.family<SocketEvent?, SocketEventType>(
  (ref, eventType) {
    final socketState = ref.watch(socketProvider);
    if (socketState.lastEvent?.type == eventType) {
      return socketState.lastEvent;
    }
    return null;
  },
);
