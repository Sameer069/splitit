import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/socket_state.dart';
import '../../providers/auth_provider.dart';
import '../../providers/groups_provider.dart';
import '../../providers/socket_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/socket_event_handler.dart';
import '../expenses/expenses_list_screen.dart';

/// Group detail screen with members, balances, and expenses
class GroupDetailScreen extends ConsumerStatefulWidget {
  final String groupId;

  const GroupDetailScreen({required this.groupId, super.key});

  @override
  ConsumerState<GroupDetailScreen> createState() => _GroupDetailScreenState();
}

class _GroupDetailScreenState extends ConsumerState<GroupDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Join Socket.io room for real-time updates
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(socketProvider.notifier).joinGroup(widget.groupId);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    // Leave Socket.io room
    ref.read(socketProvider.notifier).leaveGroup(widget.groupId);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semanticColors = theme.extension<AppSemanticColors>()!;
    final groupAsync = ref.watch(groupProvider(widget.groupId));
    final currentUserId = ref.watch(authProvider.select((s) => s.userId));

    // Listen to socket events for auto-refresh (must be in build method)
    ref.listen<SocketState>(
      socketProvider,
      (previous, next) {
        if (next.lastEvent != null &&
            [
              SocketEventType.expenseCreated,
              SocketEventType.expenseUpdated,
              SocketEventType.expenseDeleted,
              SocketEventType.settlementCreated,
              SocketEventType.balancesUpdated,
              SocketEventType.memberJoined,
              SocketEventType.memberLeft,
              SocketEventType.groupUpdated,
            ].contains(next.lastEvent!.type)) {
          ref.refresh(groupProvider(widget.groupId));
          ref.refresh(groupBalancesProvider(widget.groupId));
        }
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: groupAsync.when(
          data: (group) => Text(group.name),
          loading: () => const Text('Loading...'),
          error: (_, __) => const Text('Error'),
        ),
        actions: [
          PopupMenuButton<String>(
            onSelected: (value) async {
              switch (value) {
                case 'edit':
                  final updated = await context.push<bool>(
                    '/groups/${widget.groupId}/edit',
                  );
                  if (updated == true && mounted) {
                    ref.refresh(groupProvider(widget.groupId));
                  }
                  break;
                case 'members':
                  context.push('/groups/${widget.groupId}/members');
                  break;
                case 'leave':
                  _handleLeaveGroup();
                  break;
                case 'delete':
                  _handleDeleteGroup();
                  break;
              }
            },
            itemBuilder: (context) {
              final group = groupAsync.value;
              final isOwner = group?.ownerId == currentUserId;

              return [
                if (isOwner)
                  const PopupMenuItem(
                    value: 'edit',
                    child: Text('Edit Group'),
                  ),
                const PopupMenuItem(
                  value: 'members',
                  child: Text('Manage Members'),
                ),
                const PopupMenuItem(
                  value: 'leave',
                  child: Text('Leave Group'),
                ),
                if (isOwner)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete Group'),
                  ),
              ];
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Expenses'),
          ],
        ),
      ),
      body: groupAsync.when(
        data: (group) {
          return TabBarView(
            controller: _tabController,
            children: [
              _buildOverviewTab(group),
              _buildExpensesTab(),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          context.push('/groups/${widget.groupId}/expenses/create');
        },
        icon: const Icon(Icons.add),
        label: const Text('Add Expense'),
      ),
    );
  }

  Widget _buildOverviewTab(group) {
    final theme = Theme.of(context);
    final balancesAsync = ref.watch(groupBalancesProvider(widget.groupId));

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Members section
          Text(
            'Members',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          ...group.members.map((member) {
            return Card(
              margin: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundImage: member.avatarUrl != null
                      ? NetworkImage(member.avatarUrl!)
                      : null,
                  child: member.avatarUrl == null
                      ? Text(member.userName[0].toUpperCase())
                      : null,
                ),
                title: Text(member.userName),
                subtitle: member.userEmail != null
                    ? Text(member.userEmail!)
                    : null,
                trailing: member.userId == group.ownerId
                    ? Chip(
                        label: const Text('Owner'),
                        backgroundColor: theme.colorScheme.primaryContainer,
                      )
                    : null,
              ),
            );
          }).toList(),
          const SizedBox(height: 24),

          // Balances section
          Text(
            'Balances',
            style: theme.textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          balancesAsync.when(
            data: (balances) {
              if (balances.isEmpty) {
                return const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No expenses yet. All settled up!'),
                  ),
                );
              }

              return Column(
                children: balances.map((balance) {
                  final semanticColors = theme.extension<AppSemanticColors>()!;
                  final isPositive = balance.amount > 0;
                  final color = isPositive
                      ? semanticColors.success
                      : semanticColors.danger;

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundImage: balance.avatarUrl != null
                            ? NetworkImage(balance.avatarUrl!)
                            : null,
                        child: balance.avatarUrl == null
                            ? Text(balance.userName[0].toUpperCase())
                            : null,
                      ),
                      title: Text(balance.userName),
                      trailing: Text(
                        isPositive
                            ? '+\$${balance.amount.toStringAsFixed(2)}'
                            : '-\$${balance.amount.abs().toStringAsFixed(2)}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: color,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Text('Error loading balances: $error'),
          ),
        ],
      ),
    );
  }

  Widget _buildExpensesTab() {
    return ExpensesListScreen(groupId: widget.groupId);
  }

  Future<void> _handleLeaveGroup() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave Group'),
        content: const Text('Are you sure you want to leave this group?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(groupsNotifierProvider.notifier).leaveGroup(widget.groupId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Left group successfully')),
        );
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to leave group: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }

  Future<void> _handleDeleteGroup() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Group'),
        content: const Text(
          'Are you sure you want to delete this group? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref
          .read(groupsNotifierProvider.notifier)
          .deleteGroup(widget.groupId);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Group deleted successfully')),
        );
        context.go('/');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to delete group: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }
}
