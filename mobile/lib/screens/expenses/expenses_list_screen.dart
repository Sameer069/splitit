import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../models/expense_models.dart';
import '../../models/socket_state.dart';
import '../../providers/auth_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../providers/socket_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/socket_event_handler.dart';

/// Expenses list screen (embedded in group detail)
class ExpensesListScreen extends ConsumerStatefulWidget {
  final String groupId;

  const ExpensesListScreen({required this.groupId, super.key});

  @override
  ConsumerState<ExpensesListScreen> createState() => _ExpensesListScreenState();
}

class _ExpensesListScreenState extends ConsumerState<ExpensesListScreen> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    ref.refresh(expensesProvider(widget.groupId));
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final expensesAsync = ref.watch(expensesProvider(widget.groupId));
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
            ].contains(next.lastEvent!.type)) {
          ref.refresh(expensesProvider(widget.groupId));
        }
      },
    );

    return RefreshIndicator(
      onRefresh: _refresh,
      child: expensesAsync.when(
        data: (expenses) {
          if (expenses.isEmpty) {
            return _buildEmptyState();
          }

          return ListView.builder(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            itemCount: expenses.length,
            itemBuilder: (context, index) {
              final expense = expenses[index];
              final canEdit = expense.createdById == currentUserId;
              return _ExpenseCard(
                expense: expense,
                currentUserId: currentUserId ?? '',
                canEdit: canEdit,
                groupId: widget.groupId,
                onTap: () {
                  context.push(
                    '/groups/${widget.groupId}/expenses/${expense.id}',
                  );
                },
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
              Icons.receipt_long_outlined,
              size: 80,
              color: theme.colorScheme.primary.withOpacity(0.3),
            ),
            const SizedBox(height: 24),
            Text(
              'No Expenses Yet',
              style: theme.textTheme.headlineMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the + button to add your first expense',
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

/// Expense card widget
class _ExpenseCard extends ConsumerWidget {
  final Expense expense;
  final String currentUserId;
  final String groupId;
  final bool canEdit;
  final VoidCallback onTap;

  const _ExpenseCard({
    required this.expense,
    required this.currentUserId,
    required this.groupId,
    required this.canEdit,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final semanticColors = theme.extension<AppSemanticColors>()!;

    // Find current user's split
    final myShare = expense.splits
        .firstWhere(
          (s) => s.userId == currentUserId,
          orElse: () => const ExpenseSplit(
            id: '',
            expenseId: '',
            userId: '',
            userName: '',
            amount: 0,
          ),
        )
        .amount;

    final didIPay = expense.paidById == currentUserId;
    final owedToMe = didIPay ? expense.amount - myShare : 0;
    final iOwe = !didIPay ? myShare : 0;

    final dateFormat = DateFormat('MMM d, y');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row
              Row(
                children: [
                  // Receipt icon
                  if (expense.receiptUrl != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 12),
                      child: Icon(
                        Icons.receipt,
                        color: theme.colorScheme.primary,
                        size: 20,
                      ),
                    ),
                  // Description
                  Expanded(
                    child: Text(
                      expense.description,
                      style: theme.textTheme.titleMedium,
                    ),
                  ),
                  // Total amount
                  Text(
                    '\$${expense.amount.toStringAsFixed(2)}',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  // Edit button (only for creator)
                  if (canEdit) ...[
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.edit_outlined, size: 20),
                      onPressed: () {
                        context.push(
                          '/groups/$groupId/expenses/${expense.id}/edit',
                        );
                      },
                      tooltip: 'Edit expense',
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 8),

              // Paid by
              Text(
                'Paid by ${expense.paidByName}',
                style: theme.textTheme.bodyMedium?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 4),

              // Date
              Text(
                dateFormat.format(expense.createdAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.6),
                ),
              ),
              const SizedBox(height: 12),

              // Your share
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Your share: \$${myShare.toStringAsFixed(2)}',
                      style: theme.textTheme.bodyMedium,
                    ),
                  ),
                  if (owedToMe > 0)
                    Text(
                      'You lent \$${owedToMe.toStringAsFixed(2)}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: semanticColors.success,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  if (iOwe > 0)
                    Text(
                      'You owe \$${iOwe.toStringAsFixed(2)}',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: semanticColors.danger,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
