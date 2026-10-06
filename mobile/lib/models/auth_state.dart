/// Authentication state model
/// Tracks user authentication status, tokens, and user info
class AuthState {
  // Tokens
  final String? accessToken;
  final String? refreshToken;

  // User info
  final String? userId;
  final String? email;
  final String? name;
  final String? avatarUrl;

  // Status
  final bool isAuthenticated;
  final bool isLoading;
  final String? error;

  const AuthState({
    this.accessToken,
    this.refreshToken,
    this.userId,
    this.email,
    this.name,
    this.avatarUrl,
    this.isAuthenticated = false,
    this.isLoading = false,
    this.error,
  });

  AuthState copyWith({
    String? accessToken,
    String? refreshToken,
    String? userId,
    String? email,
    String? name,
    String? avatarUrl,
    bool? isAuthenticated,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      accessToken: accessToken ?? this.accessToken,
      refreshToken: refreshToken ?? this.refreshToken,
      userId: userId ?? this.userId,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  factory AuthState.fromJson(Map<String, dynamic> json) {
    return AuthState(
      accessToken: json['accessToken'] as String?,
      refreshToken: json['refreshToken'] as String?,
      userId: json['userId'] as String?,
      email: json['email'] as String?,
      name: json['name'] as String?,
      avatarUrl: json['avatarUrl'] as String?,
      isAuthenticated: json['isAuthenticated'] as bool? ?? false,
      isLoading: json['isLoading'] as bool? ?? false,
      error: json['error'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'userId': userId,
      'email': email,
      'name': name,
      'avatarUrl': avatarUrl,
      'isAuthenticated': isAuthenticated,
      'isLoading': isLoading,
      'error': error,
    };
  }
}

/// User model (from API)
class User {
  final String id;
  final String email;
  final String name;
  final DateTime createdAt;
  final String? avatarUrl;

  const User({
    required this.id,
    required this.email,
    required this.name,
    required this.createdAt,
    this.avatarUrl,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      avatarUrl: json['avatarUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'createdAt': createdAt.toIso8601String(),
      'avatarUrl': avatarUrl,
    };
  }
}

/// Login response from API
class LoginResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  const LoginResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'user': user.toJson(),
    };
  }
}

/// Register response from API
class RegisterResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  const RegisterResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'user': user.toJson(),
    };
  }
}
