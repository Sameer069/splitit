import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/socket_state.dart';
import '../providers/socket_provider.dart';

/// Mixin for widgets that need to react to Socket.io events
/// Usage:
/// class MyScreen extends ConsumerStatefulWidget with SocketEventHandler {
///   @override
///   void handleSocketEvent(SocketEventType type, Map<String, dynamic> data) {
///     // Handle event
///   }
/// }
mixin SocketEventHandler {
  /// Setup socket event listener in initState or build
  void listenToSocketEvents(WidgetRef ref, List<SocketEventType> eventTypes) {
    ref.listen<SocketState>(
      socketProvider,
      (previous, next) {
        if (next.lastEvent != null &&
            eventTypes.contains(next.lastEvent!.type)) {
          handleSocketEvent(next.lastEvent!.type, next.lastEvent!.data);
        }
      },
    );
  }

  /// Override this method to handle socket events
  void handleSocketEvent(SocketEventType type, Map<String, dynamic> data);
}

/// Helper to refresh data when specific events occur
/// Example: Auto-refresh expense list when expense:created/updated/deleted
class SocketEventRefresher {
  /// Listen to events and call refresh callback
  static void listen(
    WidgetRef ref,
    List<SocketEventType> eventTypes,
    VoidCallback onRefresh,
  ) {
    ref.listen<SocketState>(
      socketProvider,
      (previous, next) {
        if (next.lastEvent != null &&
            eventTypes.contains(next.lastEvent!.type)) {
          onRefresh();
        }
      },
    );
  }
}
