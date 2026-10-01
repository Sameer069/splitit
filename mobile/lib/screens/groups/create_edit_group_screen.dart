import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/group_models.dart';
import '../../providers/groups_provider.dart';
import '../../theme/app_theme.dart';
import '../../utils/validators.dart';

/// Create or edit group screen
class CreateEditGroupScreen extends ConsumerStatefulWidget {
  final String? groupId; // null = create mode
  final Group? group; // for edit mode

  const CreateEditGroupScreen({
    super.key,
    this.groupId,
    this.group,
  });

  @override
  ConsumerState<CreateEditGroupScreen> createState() =>
      _CreateEditGroupScreenState();
}

class _CreateEditGroupScreenState extends ConsumerState<CreateEditGroupScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  bool _isLoading = false;

  bool get isEditMode => widget.group != null;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.group?.name ?? '');
    _descriptionController = TextEditingController(
      text: widget.group?.description ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      if (isEditMode) {
        // Update existing group
        await ref.read(groupsNotifierProvider.notifier).updateGroup(
              widget.groupId!,
              UpdateGroupRequest(
                name: _nameController.text.trim(),
                description: _descriptionController.text.trim().isEmpty
                    ? null
                    : _descriptionController.text.trim(),
              ),
            );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Group updated successfully')),
          );
          context.pop(true); // Return true to indicate success
        }
      } else {
        // Create new group
        final group = await ref.read(groupsNotifierProvider.notifier).createGroup(
              CreateGroupRequest(
                name: _nameController.text.trim(),
                description: _descriptionController.text.trim().isEmpty
                    ? null
                    : _descriptionController.text.trim(),
              ),
            );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Group created successfully')),
          );
          // Navigate to the new group
          context.go('/groups/${group.id}');
        }
      }
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditMode ? 'Edit Group' : 'Create Group'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icon
                Icon(
                  Icons.group,
                  size: 80,
                  color: theme.colorScheme.primary,
                ),
                const SizedBox(height: 32),

                // Name field
                TextFormField(
                  controller: _nameController,
                  textInputAction: TextInputAction.next,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(
                    labelText: 'Group Name',
                    prefixIcon: Icon(Icons.label_outlined),
                    helperText: 'e.g., Roommates, Europe Trip',
                  ),
                  validator: (value) => Validators.required(value, 'Group name'),
                  enabled: !_isLoading,
                ),
                const SizedBox(height: 16),

                // Description field (optional)
                TextFormField(
                  controller: _descriptionController,
                  textInputAction: TextInputAction.done,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Description (optional)',
                    prefixIcon: Icon(Icons.description_outlined),
                    helperText: 'Add notes about this group',
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
                      : Text(isEditMode ? 'Update Group' : 'Create Group'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
