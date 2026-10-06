import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../config/app_config.dart';
import '../models/expense_models.dart';
import '../providers/auth_provider.dart';
import '../providers/expenses_provider.dart';
import '../providers/groups_provider.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/expenses/create_edit_expense_screen.dart';
import '../screens/groups/create_edit_group_screen.dart';
import '../screens/groups/group_detail_screen.dart';
import '../screens/groups/groups_list_screen.dart';
import '../screens/groups/manage_members_screen.dart';

/// Listenable that notifies when auth state changes
class _AuthStateListenable extends ChangeNotifier {
  final Ref ref;

  _AuthStateListenable(this.ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

/// App router configuration with go_router
/// Handles navigation, auth guards, and deep linking
final routerProvider = Provider<GoRouter>((ref) {
  final authListenable = _AuthStateListenable(ref);

  return GoRouter(
    initialLocation: '/splash',
    debugLogDiagnostics: true,
    refreshListenable: authListenable,
    
    // Redirect logic for auth guard
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isAuthenticated = authState.isAuthenticated;
      final isLoading = authState.isLoading;
      
      final isAuthRoute = state.matchedLocation.startsWith('/auth');
      final isSplashRoute = state.matchedLocation == '/splash';

      print('[ROUTER] Redirect check:');
      print('[ROUTER]   - Current location: ${state.matchedLocation}');
      print('[ROUTER]   - isAuthenticated: $isAuthenticated');
      print('[ROUTER]   - isLoading: $isLoading');
      print('[ROUTER]   - isAuthRoute: $isAuthRoute');
      print('[ROUTER]   - isSplashRoute: $isSplashRoute');

      // Still loading auth state - stay on splash
      if (isLoading && isSplashRoute) {
        print('[ROUTER] Decision: Stay on splash (loading)');
        return null;
      }

      // Loading complete and authenticated - go to home
      if (!isLoading && isAuthenticated && (isSplashRoute || isAuthRoute)) {
        print('[ROUTER] Decision: Redirect to / (home)');
        return '/';
      }

      // Loading complete but not authenticated - go to login
      if (!isLoading && !isAuthenticated && !isAuthRoute) {
        print('[ROUTER] Decision: Redirect to /auth/login');
        return '/auth/login';
      }

      // All good - no redirect
      print('[ROUTER] Decision: No redirect needed');
      return null;
    },

    routes: [
      // ==================== Splash ====================
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // ==================== Auth Routes ====================
      GoRoute(
        path: '/auth/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/auth/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/auth/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/auth/reset-password',
        builder: (context, state) {
          final token = state.uri.queryParameters['token'];
          if (token == null) {
            return const Scaffold(
              body: Center(child: Text('Invalid reset link')),
            );
          }
          return ResetPasswordScreen(token: token);
        },
      ),

      // ==================== Main App Routes ====================
      GoRoute(
        path: '/',
        builder: (context, state) => const GroupsListScreen(),
        routes: [
          // Create group
          GoRoute(
            path: 'groups/create',
            builder: (context, state) => const CreateEditGroupScreen(),
          ),

          // Groups
          GoRoute(
            path: 'groups/:groupId',
            builder: (context, state) {
              final groupId = state.pathParameters['groupId']!;
              return GroupDetailScreen(groupId: groupId);
            },
            routes: [
              // Edit group
              GoRoute(
                path: 'edit',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  return FutureBuilder(
                    future: ref.read(groupProvider(groupId).future),
                    builder: (context, snapshot) {
                      if (snapshot.hasData) {
                        return CreateEditGroupScreen(
                          groupId: groupId,
                          group: snapshot.data,
                        );
                      }
                      return const Scaffold(
                        body: Center(child: CircularProgressIndicator()),
                      );
                    },
                  );
                },
              ),
              // Manage members
              GoRoute(
                path: 'members',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  return ManageMembersScreen(groupId: groupId);
                },
              ),
              // Create expense
              GoRoute(
                path: 'expenses/create',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  return CreateEditExpenseScreen(groupId: groupId);
                },
              ),
              // Edit expense
              GoRoute(
                path: 'expenses/:expenseId/edit',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  final expenseId = state.pathParameters['expenseId']!;
                  return FutureBuilder<Expense>(
                    future: ref.read(
                      expenseProvider((groupId: groupId, expenseId: expenseId)).future,
                    ),
                    builder: (context, snapshot) {
                      if (snapshot.hasData) {
                        return CreateEditExpenseScreen(
                          groupId: groupId,
                          expenseId: expenseId,
                          expense: snapshot.data!,
                        );
                      }
                      return const Scaffold(
                        body: Center(child: CircularProgressIndicator()),
                      );
                    },
                  );
                },
              ),
              // Expenses
              GoRoute(
                path: 'expenses/:expenseId',
                builder: (context, state) {
                  final groupId = state.pathParameters['groupId']!;
                  final expenseId = state.pathParameters['expenseId']!;
                  return ExpenseDetailScreen(
                    groupId: groupId,
                    expenseId: expenseId,
                  );
                },
              ),
            ],
          ),

          // Invites (deep link: splitwiseapp://invite/:token)
          GoRoute(
            path: 'invite/:token',
            builder: (context, state) {
              final token = state.pathParameters['token']!;
              return InviteAcceptScreen(token: token);
            },
          ),

          // Notifications
          GoRoute(
            path: 'notifications',
            builder: (context, state) => const NotificationsScreen(),
          ),

          // Profile & Settings
          GoRoute(
            path: 'profile',
            builder: (context, state) => const ProfileScreen(),
            routes: [
              GoRoute(
                path: 'edit',
                builder: (context, state) => const EditProfileScreen(),
              ),
              GoRoute(
                path: 'change-password',
                builder: (context, state) => const ChangePasswordScreen(),
              ),
            ],
          ),
        ],
      ),
    ],

    // Error handling
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 80),
            const SizedBox(height: 16),
            Text('Page not found: ${state.matchedLocation}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

/// Splash screen - shown while checking auth state
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.receipt_long,
              size: 80,
              color: theme.colorScheme.primary,
            ),
            const SizedBox(height: 24),
            Text(
              AppConfig.appName,
              style: theme.textTheme.displayMedium,
            ),
            const SizedBox(height: 48),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}

/// Placeholder screens (will be implemented in later tasks)

class ExpenseDetailScreen extends StatelessWidget {
  final String groupId;
  final String expenseId;
  
  const ExpenseDetailScreen({
    required this.groupId, required this.expenseId, super.key,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Expense Detail')),
      body: Center(child: Text('Expense $expenseId - Task #9')),
    );
  }
}

class InviteAcceptScreen extends StatelessWidget {
  final String token;
  const InviteAcceptScreen({required this.token, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Accept Invite')),
      body: Center(child: Text('Invite $token - Task #8')),
    );
  }
}

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: const Center(child: Text('Notifications - Task #11')),
    );
  }
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: const Center(child: Text('Profile - Task #12')),
    );
  }
}

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: const Center(child: Text('Edit Profile - Task #12')),
    );
  }
}

class ChangePasswordScreen extends StatelessWidget {
  const ChangePasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Change Password')),
      body: const Center(child: Text('Change Password - Task #12')),
    );
  }
}
