/// Expense model
class Expense {
  final String id;
  final String groupId;
  final String description;
  final double amount;
  final String paidById;
  final String paidByName;
  final String createdById;
  final String createdByName;
  final DateTime createdAt;
  final DateTime? updatedAt;
  final String? receiptUrl;
  final List<ExpenseSplit> splits;
  final List<ExpenseComment> comments;

  const Expense({
    required this.id,
    required this.groupId,
    required this.description,
    required this.amount,
    required this.paidById,
    required this.paidByName,
    required this.createdById,
    required this.createdByName,
    required this.createdAt,
    this.updatedAt,
    this.receiptUrl,
    this.splits = const [],
    this.comments = const [],
  });

  factory Expense.fromJson(Map<String, dynamic> json) {
    return Expense(
      id: json['id'] as String,
      groupId: json['groupId'] as String,
      description: json['description'] as String,
      amount: (json['amount'] as num).toDouble(),
      paidById: json['paidById'] as String,
      paidByName: json['paidByName'] as String,
      createdById: json['createdById'] as String,
      createdByName: json['createdByName'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
      receiptUrl: json['receiptUrl'] as String?,
      splits: (json['splits'] as List<dynamic>?)
              ?.map((e) => ExpenseSplit.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      comments: (json['comments'] as List<dynamic>?)
              ?.map((e) => ExpenseComment.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'groupId': groupId,
      'description': description,
      'amount': amount,
      'paidById': paidById,
      'paidByName': paidByName,
      'createdById': createdById,
      'createdByName': createdByName,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'receiptUrl': receiptUrl,
      'splits': splits.map((e) => e.toJson()).toList(),
      'comments': comments.map((e) => e.toJson()).toList(),
    };
  }
}

/// Expense split
class ExpenseSplit {
  final String id;
  final String expenseId;
  final String userId;
  final String userName;
  final double amount;

  const ExpenseSplit({
    required this.id,
    required this.expenseId,
    required this.userId,
    required this.userName,
    required this.amount,
  });

  factory ExpenseSplit.fromJson(Map<String, dynamic> json) {
    return ExpenseSplit(
      id: json['id'] as String,
      expenseId: json['expenseId'] as String? ?? '', // Backend doesn't return this in list
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      amount: (json['shareAmount'] as num).toDouble(), // Backend uses 'shareAmount'
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'expenseId': expenseId,
      'userId': userId,
      'userName': userName,
      'amount': amount,
    };
  }
}

/// Expense comment
class ExpenseComment {
  final String id;
  final String expenseId;
  final String userId;
  final String userName;
  final String text;
  final DateTime createdAt;
  final String? avatarUrl;

  const ExpenseComment({
    required this.id,
    required this.expenseId,
    required this.userId,
    required this.userName,
    required this.text,
    required this.createdAt,
    this.avatarUrl,
  });

  factory ExpenseComment.fromJson(Map<String, dynamic> json) {
    return ExpenseComment(
      id: json['id'] as String,
      expenseId: json['expenseId'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      text: json['text'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'expenseId': expenseId,
      'userId': userId,
      'userName': userName,
      'text': text,
      'createdAt': createdAt.toIso8601String(),
      'avatarUrl': avatarUrl,
    };
  }
}

/// Create expense request
class CreateExpenseRequest {
  final String description;
  final double amount;
  final String paidById;
  final List<SplitInput> splits;
  final String? receiptUrl;

  const CreateExpenseRequest({
    required this.description,
    required this.amount,
    required this.paidById,
    required this.splits,
    this.receiptUrl,
  });

  factory CreateExpenseRequest.fromJson(Map<String, dynamic> json) {
    return CreateExpenseRequest(
      description: json['description'] as String,
      amount: (json['amount'] as num).toDouble(),
      paidById: json['paidById'] as String,
      splits: (json['splits'] as List<dynamic>)
          .map((e) => SplitInput.fromJson(e as Map<String, dynamic>))
          .toList(),
      receiptUrl: json['receiptUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'description': description,
      'amount': amount,
      'paidById': paidById,
      'splits': splits.map((s) => s.toJson()).toList(),
      if (receiptUrl != null) 'receiptUrl': receiptUrl,
    };
  }
}

/// Split input for create/update
class SplitInput {
  final String userId;
  final double amount;

  const SplitInput({
    required this.userId,
    required this.amount,
  });

  factory SplitInput.fromJson(Map<String, dynamic> json) {
    return SplitInput(
      userId: json['userId'] as String,
      amount: (json['amount'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'shareAmount': amount, // Backend expects 'shareAmount'
    };
  }
}

/// Update expense request
class UpdateExpenseRequest {
  final String? description;
  final double? amount;
  final String? paidById;
  final List<SplitInput>? splits;
  final String? receiptUrl;

  const UpdateExpenseRequest({
    this.description,
    this.amount,
    this.paidById,
    this.splits,
    this.receiptUrl,
  });

  factory UpdateExpenseRequest.fromJson(Map<String, dynamic> json) {
    return UpdateExpenseRequest(
      description: json['description'] as String?,
      amount: json['amount'] != null ? (json['amount'] as num).toDouble() : null,
      paidById: json['paidById'] as String?,
      splits: json['splits'] != null
          ? (json['splits'] as List<dynamic>)
              .map((e) => SplitInput.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      receiptUrl: json['receiptUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (description != null) 'description': description,
      if (amount != null) 'amount': amount,
      if (paidById != null) 'paidById': paidById,
      if (splits != null) 'splits': splits!.map((s) => s.toJson()).toList(),
      if (receiptUrl != null) 'receiptUrl': receiptUrl,
    };
  }
}

/// Add comment request
class AddCommentRequest {
  final String text;

  const AddCommentRequest({
    required this.text,
  });

  factory AddCommentRequest.fromJson(Map<String, dynamic> json) {
    return AddCommentRequest(
      text: json['text'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'text': text,
    };
  }
}
