import 'package:freezed_annotation/freezed_annotation.dart';

part 'expense_models.freezed.dart';
part 'expense_models.g.dart';

/// Expense model
@freezed
class Expense with _$Expense {
  const factory Expense({
    required String id,
    required String groupId,
    required String description,
    required double amount,
    required String paidById,
    required String paidByName,
    String? paidByAvatarUrl,
    required DateTime createdAt,
    DateTime? updatedAt,
    String? receiptUrl,
    @Default([]) List<ExpenseSplit> splits,
    @Default([]) List<ExpenseComment> comments,
  }) = _Expense;

  factory Expense.fromJson(Map<String, dynamic> json) =>
      _$ExpenseFromJson(json);
}

/// Expense split
@freezed
class ExpenseSplit with _$ExpenseSplit {
  const factory ExpenseSplit({
    required String id,
    required String userId,
    required String userName,
    String? userAvatarUrl,
    required double amount,
  }) = _ExpenseSplit;

  factory ExpenseSplit.fromJson(Map<String, dynamic> json) =>
      _$ExpenseSplitFromJson(json);
}

/// Expense comment
@freezed
class ExpenseComment with _$ExpenseComment {
  const factory ExpenseComment({
    required String id,
    required String expenseId,
    required String userId,
    required String userName,
    String? userAvatarUrl,
    required String text,
    required DateTime createdAt,
  }) = _ExpenseComment;

  factory ExpenseComment.fromJson(Map<String, dynamic> json) =>
      _$ExpenseCommentFromJson(json);
}

/// Create expense request
@freezed
class CreateExpenseRequest with _$CreateExpenseRequest {
  const factory CreateExpenseRequest({
    required String description,
    required double amount,
    required String paidById,
    required List<SplitInput> splits,
    String? receiptUrl,
  }) = _CreateExpenseRequest;

  factory CreateExpenseRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateExpenseRequestFromJson(json);

  Map<String, dynamic> toJson() => {
        'description': description,
        'amount': amount,
        'paidById': paidById,
        'splits': splits.map((s) => s.toJson()).toList(),
        if (receiptUrl != null) 'receiptUrl': receiptUrl,
      };
}

/// Split input for create/update
@freezed
class SplitInput with _$SplitInput {
  const factory SplitInput({
    required String userId,
    required double amount,
  }) = _SplitInput;

  factory SplitInput.fromJson(Map<String, dynamic> json) =>
      _$SplitInputFromJson(json);

  Map<String, dynamic> toJson() => {
        'userId': userId,
        'amount': amount,
      };
}

/// Update expense request
@freezed
class UpdateExpenseRequest with _$UpdateExpenseRequest {
  const factory UpdateExpenseRequest({
    String? description,
    double? amount,
    String? paidById,
    List<SplitInput>? splits,
    String? receiptUrl,
  }) = _UpdateExpenseRequest;

  factory UpdateExpenseRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateExpenseRequestFromJson(json);

  Map<String, dynamic> toJson() => {
        if (description != null) 'description': description,
        if (amount != null) 'amount': amount,
        if (paidById != null) 'paidById': paidById,
        if (splits != null) 'splits': splits!.map((s) => s.toJson()).toList(),
        if (receiptUrl != null) 'receiptUrl': receiptUrl,
      };
}

/// Add comment request
@freezed
class AddCommentRequest with _$AddCommentRequest {
  const factory AddCommentRequest({
    required String text,
  }) = _AddCommentRequest;

  factory AddCommentRequest.fromJson(Map<String, dynamic> json) =>
      _$AddCommentRequestFromJson(json);

  Map<String, dynamic> toJson() => {
        'text': text,
      };
}
