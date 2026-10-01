import 'package:freezed_annotation/freezed_annotation.dart';

part 'settlement_models.freezed.dart';
part 'settlement_models.g.dart';

/// Settlement model
@freezed
class Settlement with _$Settlement {
  const factory Settlement({
    required String id,
    required String groupId,
    required String payerId,
    required String payerName,
    String? payerAvatarUrl,
    required String recipientId,
    required String recipientName,
    String? recipientAvatarUrl,
    required double amount,
    required DateTime createdAt,
  }) = _Settlement;

  factory Settlement.fromJson(Map<String, dynamic> json) =>
      _$SettlementFromJson(json);
}

/// Settlement suggestion (from backend's greedy algorithm)
@freezed
class SettlementSuggestion with _$SettlementSuggestion {
  const factory SettlementSuggestion({
    required String fromUserId,
    required String fromUserName,
    required String toUserId,
    required String toUserName,
    required double amount,
  }) = _SettlementSuggestion;

  factory SettlementSuggestion.fromJson(Map<String, dynamic> json) =>
      _$SettlementSuggestionFromJson(json);
}

/// Create settlement request
@freezed
class CreateSettlementRequest with _$CreateSettlementRequest {
  const factory CreateSettlementRequest({
    required String payerId,
    required String recipientId,
    required double amount,
  }) = _CreateSettlementRequest;

  Map<String, dynamic> toJson() => {
        'payerId': payerId,
        'recipientId': recipientId,
        'amount': amount,
      };
}
