import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/expense_models.dart';
import '../../models/group_models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/expenses_provider.dart';
import '../../providers/groups_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/validators.dart';

/// Create or edit expense screen
class CreateEditExpenseScreen extends ConsumerStatefulWidget {
  final String groupId;
  final String? expenseId; // null = create mode
  final Expense? expense; // for edit mode

  const CreateEditExpenseScreen({
    super.key,
    required this.groupId,
    this.expenseId,
    this.expense,
  });

  @override
  ConsumerState<CreateEditExpenseScreen> createState() =>
      _CreateEditExpenseScreenState();
}

class _CreateEditExpenseScreenState
    extends ConsumerState<CreateEditExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _descriptionController;
  late final TextEditingController _amountController;
  late final TextEditingController _receiptUrlController;

  String? _selectedPaidById;
  Map<String, double> _splits = {}; // userId -> amount
  bool _isLoading = false;
  bool _equalSplit = true;

  bool get isEditMode => widget.expense != null;

  @override
  void initState() {
    super.initState();
    _descriptionController = TextEditingController(
      text: widget.expense?.description ?? '',
    );
    _amountController = TextEditingController(
      text: widget.expense?.amount.toStringAsFixed(2) ?? '',
    );
    _receiptUrlController = TextEditingController(
      text: widget.expense?.receiptUrl ?? '',
    );

    if (isEditMode) {
      _selectedPaidById = widget.expense!.paidById;
      // Initialize splits from existing expense
      _splits = Map.fromEntries(
        widget.expense!.splits.map((s) => MapEntry(s.userId, s.amount)),
      );
      _equalSplit = false; // Existing expense has custom splits
    } else {
      _selectedPaidById = ref.read(authProvider).userId;
    }
  }

  @override
  void dispose() {
    _descriptionController.dispose();
    _amountController.dispose();
    _receiptUrlController.dispose();
    super.dispose();
  }

  void _calculateEqualSplits(List<GroupMember> members, double totalAmount) {
    if (_equalSplit && members.isNotEmpty) {
      final amountPerPerson = totalAmount / members.length;
      _splits = Map.fromEntries(
        members.map((m) => MapEntry(m.userId, amountPerPerson)),
      );
    }
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedPaidById == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select who paid')),
      );
      return;
    }

    if (_splits.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one split')),
      );
      return;
    }

    final totalAmount = double.parse(_amountController.text);
    final splitTotal = _splits.values.reduce((a, b) => a + b);

    if ((totalAmount - splitTotal).abs() > 0.01) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Split amounts (\$${splitTotal.toStringAsFixed(2)}) must equal total amount (\$${totalAmount.toStringAsFixed(2)})',
          ),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (isEditMode) {
        // Update existing expense
        await ref.read(expensesNotifierProvider.notifier).updateExpense(
              widget.groupId,
              widget.expenseId!,
              UpdateExpenseRequest(
                description: _descriptionController.text.trim(),
                amount: totalAmount,
                paidById: _selectedPaidById,
                splits: _splits.entries
                    .map((e) => SplitInput(userId: e.key, amount: e.value))
                    .toList(),
                receiptUrl: _receiptUrlController.text.trim().isEmpty
                    ? null
                    : _receiptUrlController.text.trim(),
              ),
            );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Expense updated successfully')),
          );
          context.pop(true);
        }
      } else {
        // Create new expense
        await ref.read(expensesNotifierProvider.notifier).createExpense(
              widget.groupId,
              CreateExpenseRequest(
                description: _descriptionController.text.trim(),
                amount: totalAmount,
                paidById: _selectedPaidById!,
                splits: _splits.entries
                    .map((e) => SplitInput(userId: e.key, amount: e.value))
                    .toList(),
                receiptUrl: _receiptUrlController.text.trim().isEmpty
                    ? null
                    : _receiptUrlController.text.trim(),
              ),
            );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Expense created successfully')),
          );
          context.pop(true);
        }
      }

      // Refresh expenses list
      ref.invalidate(expensesProvider(widget.groupId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Expense'),
        content: const Text('Are you sure you want to delete this expense?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(expensesNotifierProvider.notifier).deleteExpense(
            widget.groupId,
            widget.expenseId!,
          );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Expense deleted successfully')),
        );
        context.pop(true);
      }

      // Refresh expenses list
      ref.invalidate(expensesProvider(widget.groupId));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error deleting expense: $e'),
            backgroundColor: AppColors.danger,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final groupAsync = ref.watch(groupProvider(widget.groupId));

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditMode ? 'Edit Expense' : 'Add Expense'),
        actions: isEditMode
            ? [
                IconButton(
                  icon: const Icon(Icons.delete),
                  onPressed: _isLoading ? null : _handleDelete,
                  tooltip: 'Delete expense',
                ),
              ]
            : null,
      ),
      body: groupAsync.when(
        data: (group) {
          // Calculate equal splits when amount changes (only in create mode or when switching to equal split)
          if (!isEditMode && _equalSplit && _amountController.text.isNotEmpty && _splits.isEmpty) {
            final amount = double.tryParse(_amountController.text);
            if (amount != null) {
              // Use post-frame callback to avoid calling setState during build
              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  setState(() {
                    _calculateEqualSplits(group.members, amount);
                  });
                }
              });
            }
          }

          return SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Description field
                    TextFormField(
                      controller: _descriptionController,
                      textInputAction: TextInputAction.next,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        prefixIcon: Icon(Icons.description_outlined),
                        helperText: 'e.g., Dinner at restaurant',
                      ),
                      validator: (value) =>
                          Validators.required(value, 'Description'),
                      enabled: !_isLoading,
                    ),
                    const SizedBox(height: 16),

                    // Amount field
                    TextFormField(
                      controller: _amountController,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                      decoration: const InputDecoration(
                        labelText: 'Amount',
                        prefixIcon: Icon(Icons.attach_money),
                        helperText: 'Total amount',
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Amount is required';
                        }
                        final amount = double.tryParse(value);
                        if (amount == null || amount <= 0) {
                          return 'Please enter a valid amount';
                        }
                        return null;
                      },
                      enabled: !_isLoading,
                      onChanged: (value) {
                        if (_equalSplit) {
                          setState(() {}); // Recalculate splits
                        }
                      },
                    ),
                    const SizedBox(height: 16),

                    // Paid by dropdown
                    DropdownButtonFormField<String>(
                      value: _selectedPaidById,
                      decoration: const InputDecoration(
                        labelText: 'Paid by',
                        prefixIcon: Icon(Icons.person_outlined),
                      ),
                      items: group.members.map((member) {
                        return DropdownMenuItem(
                          value: member.userId,
                          child: Text(member.userName),
                        );
                      }).toList(),
                      onChanged: _isLoading
                          ? null
                          : (value) {
                              setState(() {
                                _selectedPaidById = value;
                              });
                            },
                      validator: (value) =>
                          value == null ? 'Please select who paid' : null,
                    ),
                    const SizedBox(height: 24),

                    // Split type toggle
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Split Type',
                            style: theme.textTheme.titleMedium,
                          ),
                        ),
                        SegmentedButton<bool>(
                          segments: const [
                            ButtonSegment(
                              value: true,
                              label: Text('Equal'),
                              icon: Icon(Icons.pie_chart_outline),
                            ),
                            ButtonSegment(
                              value: false,
                              label: Text('Custom'),
                              icon: Icon(Icons.edit_outlined),
                            ),
                          ],
                          selected: {_equalSplit},
                          onSelectionChanged: _isLoading
                              ? null
                              : (Set<bool> newSelection) {
                                  setState(() {
                                    _equalSplit = newSelection.first;
                                    if (_equalSplit) {
                                      final amount =
                                          double.tryParse(_amountController.text);
                                      if (amount != null) {
                                        _calculateEqualSplits(group.members, amount);
                                      }
                                    }
                                  });
                                },
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Splits list
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Split Between',
                              style: theme.textTheme.titleSmall,
                            ),
                            const SizedBox(height: 12),
                            ...group.members.map((member) {
                              final splitAmount = _splits[member.userId] ?? 0.0;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Row(
                                  children: [
                                    Expanded(
                                      flex: 2,
                                      child: Text(member.userName),
                                    ),
                                    if (_equalSplit)
                                      Text(
                                        '\$${splitAmount.toStringAsFixed(2)}',
                                        style: theme.textTheme.bodyLarge,
                                      )
                                    else
                                      Expanded(
                                        child: TextFormField(
                                          initialValue:
                                              splitAmount.toStringAsFixed(2),
                                          keyboardType: TextInputType.number,
                                          decoration: const InputDecoration(
                                            prefixText: '\$',
                                            isDense: true,
                                          ),
                                          onChanged: (value) {
                                            final amount = double.tryParse(value);
                                            if (amount != null) {
                                              setState(() {
                                                _splits[member.userId] = amount;
                                              });
                                            }
                                          },
                                          enabled: !_isLoading,
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            }).toList(),
                            const Divider(height: 24),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Total Split',
                                  style: theme.textTheme.titleSmall,
                                ),
                                Text(
                                  '\$${_splits.values.fold(0.0, (a, b) => a + b).toStringAsFixed(2)}',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Receipt URL field (optional)
                    TextFormField(
                      controller: _receiptUrlController,
                      keyboardType: TextInputType.url,
                      textInputAction: TextInputAction.done,
                      decoration: const InputDecoration(
                        labelText: 'Receipt URL (optional)',
                        prefixIcon: Icon(Icons.receipt_outlined),
                        helperText: 'Link to receipt image',
                      ),
                      enabled: !_isLoading,
                      onFieldSubmitted: (_) => _handleSubmit(),
                    ),
                    const SizedBox(height: 32),

                    // Submit button
                    ElevatedButton(
                      onPressed: _isLoading ? null : _handleSubmit,
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : Text(isEditMode ? 'Update Expense' : 'Create Expense'),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Text('Error loading group: $error'),
        ),
      ),
    );
  }
}
