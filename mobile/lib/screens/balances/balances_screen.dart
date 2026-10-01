import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/socket_state.dart';
import '../../providers/groups_provider.dart';
import '../../providers/settlements_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/socket_event_handler.dart';

/// Balances screen showing who owes whom
class BalancesScreen extends ConsumerStatefulWidget {
  final String groupId;

  const BalancesScreen({super.key, required this.groupId});

  @override
  ConsumerState<BalancesScreen> createState() => _BalancesScreenState();
}

class _BalancesScreenState extends ConsumerState<BalancesScreen> {
  @override
  void initState() {
    super.initState();

    // Auto-refresh when balance events occur
    WidgetsBinding.instance.addPostFrameCallback((_) {
      SocketEventRefresher.listen(
        ref,
        [
          SocketEventType.balancesUpdated,
          SocketEventType.settlementCreated,
          SocketEventType.expenseCreated,
          SocketEventType.expenseUpdated,
          SocketEventType.expenseDeleted,
        ],
        () {
          ref.refresh(groupBalancesProvider(widget.groupId));
          ref.refresh(settlementsProvider(widget.groupId));
        },
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final semanticColors = theme.extension<AppSemanticColors>()!;
    final balancesAsync = ref.watch(groupBalancesProvider(widget.groupId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Balances'),
      ),
      body: balancesAsync.when(
        data: (balances) {
          if (balances.isEmpty) {
            return _buildSettledState();
          }

          // Separate positive (owed to them) and negative (they owe)
          final positiveBalances =
              balances.where((b) => b.amount > 0).toList();
          final negativeBalances =
              balances.where((b) => b.amount < 0).toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Positive balances (people owed money)
              if (positiveBalances.isNotEmpty) ...[
                Text(
                  'Owed Money',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: semanticColors.success,
                  ),
                ),
                const SizedBox(height: 12),
                ...positiveBalances.map((balance) {
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
                      subtitle: const Text('is owed'),
                      trailing: Text(
                        '+\$${balance.amount.toStringAsFixed(2)}',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: semanticColors.success,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                }).toList(),
                const SizedBox(height: 24),
              ],

              // Negative balances (people who owe money)
              if (negativeBalances.isNotEmpty) ...[
                Text(
                  'Owes Money',
                  style: theme.textTheme.titleLarge?.copyWith(
                    color: semanticColors.danger,
                  ),
                ),
                const SizedBox(height: 12),
                ...negativeBalances.map((balance) {
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
                      subtitle: const Text('owes'),
                      trailing: Text(
                        '-\$${balance.amount.abs().toStringAsFixed(2)}',
                        style: theme.textTheme.titleLarge?.copyWith(
                          color: semanticColors.danger,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                }).toList(),
                const SizedBox(height: 24),
              ],

              // Settlement suggestions button
              ElevatedButton.icon(
                onPressed: () {
                  context.push('/groups/${widget.groupId}/settlements');
                },
                icon: const Icon(Icons.auto_fix_high),
                label: const Text('Simplify Settlements'),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error: $error'),
        ),
      ),
    );
  }

  Widget _buildSettledState() {
    final theme = Theme.of(context);
    final semanticColors = theme.extension<AppSemanticColors>()!;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.check_circle_outline,
              size: 80,
              color: semanticColors.success,
            ),
            const SizedBox(height: 24),
            Text(
              'All Settled Up!',
              style: theme.textTheme.displaySmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Everyone has been paid back',
              style: theme.textTheme.bodyLarge?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
