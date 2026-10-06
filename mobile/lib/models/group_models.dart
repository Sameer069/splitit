/// Group model
class Group {
  final String id;
  final String name;
  final String ownerId;
  final DateTime createdAt;
  final String? description;
  final DateTime? updatedAt;
  final List<GroupMember> members;

  const Group({
    required this.id,
    required this.name,
    required this.ownerId,
    required this.createdAt,
    this.description,
    this.updatedAt,
    this.members = const [],
  });

  Group copyWith({
    String? id,
    String? name,
    String? ownerId,
    DateTime? createdAt,
    String? description,
    DateTime? updatedAt,
    List<GroupMember>? members,
  }) {
    return Group(
      id: id ?? this.id,
      name: name ?? this.name,
      ownerId: ownerId ?? this.ownerId,
      createdAt: createdAt ?? this.createdAt,
      description: description ?? this.description,
      updatedAt: updatedAt ?? this.updatedAt,
      members: members ?? this.members,
    );
  }

  factory Group.fromJson(Map<String, dynamic> json) {
    return Group(
      id: json['id'] as String,
      name: json['name'] as String,
      ownerId: json['ownerId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      description: json['description'] as String?, // Optional - backend doesn't have this yet
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null, // Optional - backend doesn't have this yet
      members: (json['members'] as List<dynamic>?)
              ?.map((e) => GroupMember.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'ownerId': ownerId,
      'createdAt': createdAt.toIso8601String(),
      if (description != null) 'description': description,
      if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      'members': members.map((e) => e.toJson()).toList(),
    };
  }
}

/// Group member
class GroupMember {
  final String id;
  final String userId;
  final String groupId;
  final String userName;
  final DateTime joinedAt;
  final String? userEmail;
  final String? avatarUrl;

  const GroupMember({
    required this.id,
    required this.userId,
    required this.groupId,
    required this.userName,
    required this.joinedAt,
    this.userEmail,
    this.avatarUrl,
  });

  factory GroupMember.fromJson(Map<String, dynamic> json) {
    return GroupMember(
      id: json['id'] as String,
      userId: json['userId'] as String,
      groupId: json['groupId'] as String,
      userName: json['userName'] as String,
      joinedAt: DateTime.parse(json['joinedAt'] as String),
      userEmail: json['userEmail'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'groupId': groupId,
      'userName': userName,
      'joinedAt': joinedAt.toIso8601String(),
      'userEmail': userEmail,
      'avatarUrl': avatarUrl,
    };
  }
}

/// Group balance (per member)
class GroupBalance {
  final String userId;
  final String userName;
  final double amount; // positive = owed to user, negative = user owes
  final String? avatarUrl;

  const GroupBalance({
    required this.userId,
    required this.userName,
    required this.amount,
    this.avatarUrl,
  });

  factory GroupBalance.fromJson(Map<String, dynamic> json) {
    return GroupBalance(
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      amount: (json['amount'] as num).toDouble(),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userId': userId,
      'userName': userName,
      'amount': amount,
      'avatarUrl': avatarUrl,
    };
  }
}

/// Create group request
class CreateGroupRequest {
  final String name;
  final String? description;

  const CreateGroupRequest({
    required this.name,
    this.description,
  });

  factory CreateGroupRequest.fromJson(Map<String, dynamic> json) {
    return CreateGroupRequest(
      name: json['name'] as String,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      if (description != null) 'description': description,
    };
  }
}

/// Update group request
class UpdateGroupRequest {
  final String? name;
  final String? description;

  const UpdateGroupRequest({
    this.name,
    this.description,
  });

  factory UpdateGroupRequest.fromJson(Map<String, dynamic> json) {
    return UpdateGroupRequest(
      name: json['name'] as String?,
      description: json['description'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (name != null) 'name': name,
      if (description != null) 'description': description,
    };
  }
}

/// Add member request
class AddMemberRequest {
  final String email;

  const AddMemberRequest({
    required this.email,
  });

  factory AddMemberRequest.fromJson(Map<String, dynamic> json) {
    return AddMemberRequest(
      email: json['email'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'email': email,
    };
  }
}
