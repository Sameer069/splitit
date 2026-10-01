# Socket.io Real-time Integration Guide

This guide explains how the Socket.io real-time synchronization works in the Flutter app and how to use it.

## Architecture Overview

The Socket.io client:
1. **Auto-connects** when user logs in (JWT token sent in auth handshake)
2. **Auto-disconnects** when user logs out
3. **Auto-reconnects** with exponential backoff if connection drops
4. **Joins group rooms** for targeted updates (only receives events for groups you're in)
5. **Integrates with Riverpod** to update UI automatically

## Connection Flow

```
User logs in
  ↓
AuthProvider updates state with accessToken
  ↓
SocketNotifier listens to auth changes
  ↓
Socket connects with JWT: socket.io/socket.io.js?auth={"token":"<JWT>"}
  ↓
Server verifies JWT in middleware
  ↓
Connection established
  ↓
Auto-join user room (for personal notifications)
  ↓
User navigates to group screen
  ↓
Screen calls: ref.read(socketProvider.notifier).joinGroup(groupId)
  ↓
Socket joins group room
  ↓
Real-time events start flowing
```

## Supported Events

### Expense Events
- `expense:created` - New expense added to group
- `expense:updated` - Expense edited (description, amount, splits)
- `expense:deleted` - Expense removed

### Comment Events
- `comment:added` - Comment posted on expense
- `comment:deleted` - Comment removed

### Settlement Events
- `settlement:created` - Payment recorded

### Balance Events
- `balances:updated` - Group balances recalculated (after expense/settlement)

### Member Events
- `member:joined` - New member added to group
- `member:left` - Member removed from group

### Invite Events
- `invite:accepted` - Someone accepted your group invite

### Group Events
- `group:updated` - Group name/description changed

### Notification Events
- `notification:new` - New in-app notification

## Usage in Screens

### 1. Join Group Room (Groups/Expenses Screens)

When entering a group screen, join the room:

```dart
@override
void initState() {
  super.initState();
  // Join group room for real-time updates
  WidgetsBinding.instance.addPostFrameCallback((_) {
    ref.read(socketProvider.notifier).joinGroup(widget.groupId);
  });
}

@override
void dispose() {
  // Leave group room when leaving screen
  ref.read(socketProvider.notifier).leaveGroup(widget.groupId);
  super.dispose();
}
```

### 2. Listen to Events and Auto-Refresh

#### Option A: Using SocketEventRefresher (Recommended)

```dart
class ExpenseListScreen extends ConsumerStatefulWidget {
  @override
  ConsumerState<ExpenseListScreen> createState() => _ExpenseListScreenState();
}

class _ExpenseListScreenState extends ConsumerState<ExpenseListScreen> {
  @override
  void initState() {
    super.initState();
    
    // Auto-refresh when expense events occur
    WidgetsBinding.instance.addPostFrameCallback((_) {
      SocketEventRefresher.listen(
        ref,
        [
          SocketEventType.expenseCreated,
          SocketEventType.expenseUpdated,
          SocketEventType.expenseDeleted,
        ],
        () {
          // Refresh expense list
          ref.refresh(expensesProvider);
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final expenses = ref.watch(expensesProvider);
    // Build UI...
  }
}
```

#### Option B: Manual Event Handling

```dart
class ExpenseListScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch socket state
    ref.listen<SocketState>(
      socketProvider,
      (previous, next) {
        if (next.lastEvent != null) {
          switch (next.lastEvent!.type) {
            case SocketEventType.expenseCreated:
              // Handle new expense
              final expenseData = next.lastEvent!.data;
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('New expense: ${expenseData['description']}')),
              );
              // Refresh list
              ref.refresh(expensesProvider);
              break;
              
            case SocketEventType.expenseUpdated:
              // Handle updated expense
              ref.refresh(expensesProvider);
              break;
              
            case SocketEventType.expenseDeleted:
              // Handle deleted expense
              ref.refresh(expensesProvider);
              break;
              
            default:
              break;
          }
        }
      },
    );

    final expenses = ref.watch(expensesProvider);
    return ListView.builder(...);
  }
}
```

### 3. Show Real-time Notifications

```dart
class HomeScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Listen to notification events
    ref.listen<SocketState>(
      socketProvider,
      (previous, next) {
        if (next.lastEvent?.type == SocketEventType.notificationNew) {
          final notification = next.lastEvent!.data;
          
          // Show snackbar or in-app notification
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(notification['message']),
              action: SnackBarAction(
                label: 'View',
                onPressed: () {
                  // Navigate to relevant screen
                },
              ),
            ),
          );
        }
      },
    );

    // Show unread notification badge
    final unreadCount = ref.watch(
      socketProvider.select((s) => s.unreadNotifications),
    );

    return Badge(
      label: Text('$unreadCount'),
      isLabelVisible: unreadCount > 0,
      child: IconButton(
        icon: Icon(Icons.notifications),
        onPressed: () {
          // Navigate to notifications
        },
      ),
    );
  }
}
```

### 4. Show Connection Status

```dart
class ConnectionIndicator extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isConnected = ref.watch(
      socketProvider.select((s) => s.isConnected),
    );
    final error = ref.watch(
      socketProvider.select((s) => s.error),
    );

    if (error != null) {
      return Container(
        color: Colors.red,
        padding: EdgeInsets.all(8),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.white),
            SizedBox(width: 8),
            Text('Connection error: $error', style: TextStyle(color: Colors.white)),
          ],
        ),
      );
    }

    if (!isConnected) {
      return Container(
        color: Colors.orange,
        padding: EdgeInsets.all(8),
        child: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: 8),
            Text('Connecting...', style: TextStyle(color: Colors.white)),
          ],
        ),
      );
    }

    return SizedBox.shrink(); // Connected - no indicator
  }
}
```

## Event Data Structures

### expense:created / expense:updated
```json
{
  "id": "expense-id",
  "description": "Dinner",
  "amount": 50.0,
  "groupId": "group-id",
  "paidById": "user-id",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

### expense:deleted
```json
{
  "id": "expense-id",
  "groupId": "group-id"
}
```

### comment:added
```json
{
  "id": "comment-id",
  "expenseId": "expense-id",
  "userId": "user-id",
  "text": "Thanks for covering this!",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

### settlement:created
```json
{
  "id": "settlement-id",
  "groupId": "group-id",
  "payerId": "user-id",
  "recipientId": "user-id",
  "amount": 25.0,
  "createdAt": "2024-01-01T12:00:00Z"
}
```

### balances:updated
```json
{
  "groupId": "group-id",
  "balances": [
    {
      "userId": "user-id-1",
      "amount": 25.0  // positive = owed to user
    },
    {
      "userId": "user-id-2",
      "amount": -25.0  // negative = user owes
    }
  ]
}
```

### member:joined / member:left
```json
{
  "groupId": "group-id",
  "userId": "user-id",
  "userName": "John Doe"
}
```

### notification:new
```json
{
  "id": "notification-id",
  "type": "expense_created",
  "message": "John added an expense: Dinner",
  "createdAt": "2024-01-01T12:00:00Z",
  "metadata": {
    "groupId": "group-id",
    "expenseId": "expense-id"
  }
}
```

## Best Practices

### 1. Always Join/Leave Rooms
```dart
// ✅ Good
@override
void initState() {
  super.initState();
  WidgetsBinding.instance.addPostFrameCallback((_) {
    ref.read(socketProvider.notifier).joinGroup(widget.groupId);
  });
}

@override
void dispose() {
  ref.read(socketProvider.notifier).leaveGroup(widget.groupId);
  super.dispose();
}

// ❌ Bad - no cleanup
@override
void initState() {
  super.initState();
  ref.read(socketProvider.notifier).joinGroup(widget.groupId);
}
```

### 2. Refresh Providers, Don't Mutate State
```dart
// ✅ Good - trigger provider refresh
SocketEventRefresher.listen(ref, [SocketEventType.expenseCreated], () {
  ref.refresh(expensesProvider);
});

// ❌ Bad - manual state mutation
SocketEventRefresher.listen(ref, [SocketEventType.expenseCreated], () {
  setState(() {
    expenses.add(newExpense); // Don't do this
  });
});
```

### 3. Use Selective Watching
```dart
// ✅ Good - only rebuilds when unread count changes
final unreadCount = ref.watch(
  socketProvider.select((s) => s.unreadNotifications),
);

// ❌ Bad - rebuilds on every socket state change
final socketState = ref.watch(socketProvider);
final unreadCount = socketState.unreadNotifications;
```

### 4. Handle Reconnection
The socket automatically reconnects, but you may want to refresh data:

```dart
ref.listen<SocketState>(
  socketProvider,
  (previous, next) {
    // Reconnected after disconnect
    if (previous?.isConnected == false && next.isConnected) {
      // Refresh all data to ensure consistency
      ref.refresh(groupsProvider);
      ref.refresh(expensesProvider);
    }
  },
);
```

## Troubleshooting

### Socket not connecting
1. Check auth token is valid: `ref.read(authProvider).accessToken`
2. Check server is running: `curl http://localhost:3000`
3. Check Socket.io server URL: `AppConfig.socketUrl`

### Events not received
1. Verify you joined the group room: `ref.read(socketProvider).joinedGroups`
2. Check server logs for event emission
3. Enable socket logging: Set `if (false)` to `if (true)` in socket_provider.dart

### Duplicate events
This can happen if you join the same room multiple times. Always call `leaveGroup` in `dispose()`.

### Memory leaks
Always dispose socket listeners and leave rooms when widgets are destroyed.

## Testing

### Mock Socket Events
```dart
// In tests, you can trigger socket events manually:
final container = ProviderContainer();

// Simulate expense created event
final socketNotifier = container.read(socketProvider.notifier);
socketNotifier.state = socketNotifier.state.copyWith(
  lastEvent: SocketEvent(
    type: SocketEventType.expenseCreated,
    data: {'id': 'test-expense', 'description': 'Test'},
    timestamp: DateTime.now(),
  ),
);

// Verify UI updates
expect(find.text('Test'), findsOneWidget);
```

## Performance Considerations

- **Selective rebuilds**: Use `select` to only rebuild when specific fields change
- **Debouncing**: If receiving many events, debounce refreshes (e.g., max 1 refresh per second)
- **Lazy room joins**: Only join rooms for visible screens
- **Cleanup**: Always leave rooms when navigating away

## Summary

```dart
// 1. Socket connects automatically when user logs in (AuthProvider)
// 2. Join group rooms when entering screens
ref.read(socketProvider.notifier).joinGroup(groupId);

// 3. Listen to events and refresh data
SocketEventRefresher.listen(ref, [SocketEventType.expenseCreated], () {
  ref.refresh(expensesProvider);
});

// 4. Leave room when exiting screen
ref.read(socketProvider.notifier).leaveGroup(groupId);
```

That's it! Your app now has real-time sync with zero manual refresh buttons. 🎉
