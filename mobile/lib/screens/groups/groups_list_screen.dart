import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/socket_state.dart';
import '../../providers/groups_provider.dart';
import '../../providers/socket_provider.dart';
import '../../utils/socket_event_handler.dart';

/// Home screen - displays list of user's groups
class GroupsListScreen extends ConsumerStatefulWidget {
  const GroupsListScreen({super.key});

  @override
  ConsumerState<GroupsListScreen> createState() => _GroupsListScreenState();
}

class _GroupsListScreenState extends ConsumerState<GroupsListScreen> {
  Future<void> _refresh() async {
    ref.refresh(groupsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final groupsAsync = ref.watch(groupsProvider);

    // Listen to socket events for auto-refresh (must be in build method)
    ref.listen<SocketState>(
      socketProvider,
      (previous, next) {
        if (next.lastEvent != null &&
            [
              SocketEventType.memberJoined,
              SocketEventType.memberLeft,
              SocketEventType.groupUpdated,
              SocketEventType.inviteAccepted,
            ].contains(next.lastEvent!.type)) {
          ref.refresh(groupsProvider);
        }
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Groups'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              context.push('/notifications');
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outlined),
            onPressed: () {
              context.push('/profile');
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: groupsAsync.when(
          data: (groups) {
            if (groups.isEmpty) {
              return _buildEmptyState();
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: groups.length,
              itemBuilder: (context, index) {
                final group = groups[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(16),
                    leading: CircleAvatar(
                      backgroundColor: theme.colorScheme.primaryContainer,
                      child: Icon(
                        Icons.group,
                        color: theme.colorScheme.onPrimaryContainer,
                      ),
                    ),
                    title: Text(
                      group.name,
                      style: theme.textTheme.titleMedium,
                    ),
                    subtitle: Text(
                      '${group.members.length} members',
                      style: theme.textTheme.bodyMedium,
                    ),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      context.push('/groups/${group.id}');
                    },
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, stack) => Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48),
                const SizedBox(height: 16),
                Text('Error: $error'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _refresh,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final created = await context.push<bool>('/groups/create');
          if (created == true && mounted) {
            ref.refresh(groupsProvider);
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Create Group'),
      ),
    );
  }

  Widget _buildEmptyState() {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.group_outlined,
              size: 80,
              color: theme.colorScheme.primary.withOpacity(0.3),
            ),
            const SizedBox(height: 24),
            Text(
              'No Groups Yet',
              style: theme.textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Create a group to start splitting expenses with friends',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () async {
                final created = await context.push<bool>('/groups/create');
                if (created == true && mounted) {
                  ref.refresh(groupsProvider);
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Create Your First Group'),
            ),
          ],
        ),
      ),
    );
  }
}
