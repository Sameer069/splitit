import 'package:freezed_annotation/freezed_annotation.dart';

part 'group_models.freezed.dart';
part 'group_models.g.dart';

/// Group model
@freezed
class Group with _$Group {
  const factory Group({
    required String id,
    required String name,
    String? description,
    required String ownerId,
    required DateTime createdAt,
    DateTime? updatedAt,
    @Default([]) List<GroupMember> members,
  }) = _Group;

  factory Group.fromJson(Map<String, dynamic> json) => _$GroupFromJson(json);
}

/// Group member
@freezed
class GroupMember with _$GroupMember {
  const factory GroupMember({
    required String id,
    required String userId,
    required String groupId,
    required String userName,
    String? userEmail,
    String? avatarUrl,
    required DateTime joinedAt,
  }) = _GroupMember;

  factory GroupMember.fromJson(Map<String, dynamic> json) =>
      _$GroupMemberFromJson(json);
}

/// Group balance (per member)
@freezed
class GroupBalance with _$GroupBalance {
  const factory GroupBalance({
    required String userId,
    required String userName,
    String? avatarUrl,
    required double amount, // positive = owed to user, negative = user owes
  }) = _GroupBalance;

  factory GroupBalance.fromJson(Map<String, dynamic> json) =>
      _$GroupBalanceFromJson(json);
}

/// Create group request
@freezed
class CreateGroupRequest with _$CreateGroupRequest {
  const factory CreateGroupRequest({
    required String name,
    String? description,
  }) = _CreateGroupRequest;

  factory CreateGroupRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateGroupRequestFromJson(json);

  Map<String, dynamic> toJson() => {
        'name': name,
        if (description != null) 'description': description,
      };
}

/// Update group request
@freezed
class UpdateGroupRequest with _$UpdateGroupRequest {
  const factory UpdateGroupRequest({
    String? name,
    String? description,
  }) = _UpdateGroupRequest;

  factory UpdateGroupRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateGroupRequestFromJson(json);

  Map<String, dynamic> toJson() => {
        if (name != null) 'name': name,
        if (description != null) 'description': description,
      };
}

/// Add member request
@freezed
class AddMemberRequest with _$AddMemberRequest {
  const factory AddMemberRequest({
    required String email,
  }) = _AddMemberRequest;

  factory AddMemberRequest.fromJson(Map<String, dynamic> json) =>
      _$AddMemberRequestFromJson(json);

  Map<String, dynamic> toJson() => {
        'email': email,
      };
}
