/// Settlement model
class Settlement {
  final String id;
  final String groupId;
  final String fromUserId;
  final String fromUserName;
  final String toUserId;
  final String toUserName;
  final double amount;
  final DateTime createdAt;
  final String? note;

  const Settlement({
    required this.id,
    required this.groupId,
    required this.fromUserId,
    required this.fromUserName,
    required this.toUserId,
    required this.toUserName,
    required this.amount,
    required this.createdAt,
    this.note,
  });

  factory Settlement.fromJson(Map<String, dynamic> json) {
    return Settlement(
      id: json['id'] as String,
      groupId: json['groupId'] as String,
      fromUserId: json['fromUserId'] as String,
      fromUserName: json['fromUserName'] as String,
      toUserId: json['toUserId'] as String,
      toUserName: json['toUserName'] as String,
      amount: (json['amount'] as num).toDouble(),
      createdAt: DateTime.parse(json['createdAt'] as String),
      note: json['note'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'groupId': groupId,
      'fromUserId': fromUserId,
      'fromUserName': fromUserName,
      'toUserId': toUserId,
      'toUserName': toUserName,
      'amount': amount,
      'createdAt': createdAt.toIso8601String(),
      'note': note,
    };
  }
}

/// Settlement suggestion (from backend's greedy algorithm)
class SettlementSuggestion {
  final String fromUserId;
  final String fromUserName;
  final String toUserId;
  final String toUserName;
  final double amount;

  const SettlementSuggestion({
    required this.fromUserId,
    required this.fromUserName,
    required this.toUserId,
    required this.toUserName,
    required this.amount,
  });

  factory SettlementSuggestion.fromJson(Map<String, dynamic> json) {
    return SettlementSuggestion(
      fromUserId: json['fromUserId'] as String,
      fromUserName: json['fromUserName'] as String,
      toUserId: json['toUserId'] as String,
      toUserName: json['toUserName'] as String,
      amount: (json['amount'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fromUserId': fromUserId,
      'fromUserName': fromUserName,
      'toUserId': toUserId,
      'toUserName': toUserName,
      'amount': amount,
    };
  }
}

/// Create settlement request
class CreateSettlementRequest {
  final String toUserId;
  final double amount;
  final String? note;

  const CreateSettlementRequest({
    required this.toUserId,
    required this.amount,
    this.note,
  });

  factory CreateSettlementRequest.fromJson(Map<String, dynamic> json) {
    return CreateSettlementRequest(
      toUserId: json['toUserId'] as String,
      amount: (json['amount'] as num).toDouble(),
      note: json['note'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'toUserId': toUserId,
      'amount': amount,
      if (note != null) 'note': note,
    };
  }
}
