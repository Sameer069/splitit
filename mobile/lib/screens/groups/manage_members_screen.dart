import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../providers/groups_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/add_member_dialog.dart';

/// Manage group members screen (owner only)
class ManageMembersScreen extends ConsumerWidget {
  final String groupId;

  const ManageMembersScreen({super.key, required this.groupId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final groupAsync = ref.watch(groupProvider(groupId));
    final currentUserId = ref.watch(authProvider.select((s) => s.userId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Manage Members'),
      ),
      body: groupAsync.when(
        data: (group) {
          final isOwner = group.ownerId == currentUserId;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Info banner
              if (!isOwner)
                Card(
                  color: theme.colorScheme.surfaceVariant,
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text(
                      'Only the group owner can add or remove members.',
                    ),
                  ),
                ),
              if (!isOwner) const SizedBox(height: 16),

              // Members list
              ...group.members.map((member) {
                final isMemberOwner = member.userId == group.ownerId;
                final isSelf = member.userId == currentUserId;

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
                    trailing: isMemberOwner
                        ? Chip(
                            label: const Text('Owner'),
                            backgroundColor: theme.colorScheme.primaryContainer,
                          )
                        : (isOwner && !isSelf)
                            ? IconButton(
                                icon: const Icon(Icons.remove_circle_outline),
                                color: AppColors.danger,
                                onPressed: () => _handleRemoveMember(
                                  context,
                                  ref,
                                  member.userId,
                                  member.userName,
                                ),
                              )
                            : null,
                  ),
                );
              }).toList(),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
      floatingActionButton: groupAsync.maybeWhen(
        data: (group) {
          final isOwner = group.ownerId == currentUserId;
          if (!isOwner) return null;

          return FloatingActionButton.extended(
            onPressed: () => _handleAddMember(context, ref),
            icon: const Icon(Icons.person_add),
            label: const Text('Add Member'),
          );
        },
        orElse: () => null,
      ),
    );
  }

  Future<void> _handleAddMember(BuildContext context, WidgetRef ref) async {
    final added = await showDialog<bool>(
      context: context,
      builder: (context) => AddMemberDialog(groupId: groupId),
    );

    if (added == true) {
      // Refresh group to show new member
      ref.refresh(groupProvider(groupId));
    }
  }

  Future<void> _handleRemoveMember(
    BuildContext context,
    WidgetRef ref,
    String userId,
    String userName,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Member'),
        content: Text('Remove $userName from this group?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Remove'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(groupsNotifierProvider.notifier).removeMember(
            groupId,
            userId,
          );

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Removed $userName from group')),
        );
        ref.refresh(groupProvider(groupId));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to remove member: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    }
  }
}
