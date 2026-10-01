# Dart API Client Generation Guide

This guide explains how to generate the type-safe Dart API client from the backend's OpenAPI specification.

## Prerequisites

1. **Backend must be set up**:
   ```bash
   cd server
   npm install
   ```

2. **OpenAPI Generator CLI** (installed via server's devDependencies):
   - `@openapitools/openapi-generator-cli@^2.15.3`
   - This will be available after `npm install` in server/

## Step 1: Generate OpenAPI Spec from Backend

The backend uses `zod-to-openapi` to generate the OpenAPI 3.0 spec from Zod validation schemas.

```bash
cd server
npm run generate:openapi
```

This creates `server/openapi.json` with all API endpoints, request/response schemas, and authentication requirements.

**What this generates:**
- Complete API documentation
- Request/response type definitions
- Authentication (Bearer token) requirements
- Error response schemas
- All endpoints for:
  - Authentication (register, login, refresh token, Google OAuth)
  - Users (profile, update, change password)
  - Groups (CRUD, members, balances)
  - Expenses (CRUD, splits, comments, receipts)
  - Settlements (create, list, simplified suggestions)
  - Invites (create, accept, list)
  - Notifications (list, mark as read, push token registration)

## Step 2: Generate Dart Client

Once `openapi.json` exists, generate the Dart/Dio client:

```bash
cd server
npm run generate:dart-client
```

This command does two things:
1. Runs `generate:openapi` (ensures spec is up-to-date)
2. Runs `openapi-generator-cli` to generate Dart code

**Generator Configuration:**
```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g dart-dio \
  -o ../mobile/lib/api \
  --additional-properties=pubName=splitwise_api,pubAuthor=SplitIt,pubDescription=Generated API client,nullableFields=true,legacyDiscriminatorBehavior=false
```

**Output Location:** `mobile/lib/api/`

**Generated Files:**
```
mobile/lib/api/
├── lib/
│   ├── api/                  # API endpoints
│   │   ├── authentication_api.dart
│   │   ├── user_api.dart
│   │   ├── groups_api.dart
│   │   ├── expenses_api.dart
│   │   ├── settlements_api.dart
│   │   ├── invites_api.dart
│   │   └── notifications_api.dart
│   ├── model/                # Data models
│   │   ├── user.dart
│   │   ├── group.dart
│   │   ├── expense.dart
│   │   ├── split.dart
│   │   ├── settlement.dart
│   │   ├── notification.dart
│   │   └── ... (all DTOs)
│   └── splitwise_api.dart   # Main export
├── pubspec.yaml
├── README.md
└── .openapi-generator/
```

## Step 3: Install Generated Client Dependencies

The generated client has its own `pubspec.yaml`. You don't need to manually manage it - just ensure your main app's `pubspec.yaml` references the dependencies:

```bash
cd mobile
flutter pub get
```

The generated client will automatically pull:
- `dio` for HTTP
- `built_value` / `built_collection` for immutable models
- `json_annotation` for serialization

## Step 4: Use the Generated Client in Your App

### Import the API Client

```dart
import 'package:splitwise_api/splitwise_api.dart';
```

### Initialize with Dio

```dart
final dio = Dio(BaseOptions(
  baseUrl: 'http://localhost:3000',
  headers: {
    'Authorization': 'Bearer $accessToken',
  },
));

final authApi = AuthenticationApi(dio);
final userApi = UserApi(dio);
final groupsApi = GroupsApi(dio);
final expensesApi = ExpensesApi(dio);
// ... etc
```

### Example API Calls

#### Login
```dart
final response = await authApi.login(
  LoginRequest(
    email: 'user@example.com',
    password: 'password123',
  ),
);

final accessToken = response.data!.accessToken;
final refreshToken = response.data!.refreshToken;
```

#### Get Groups
```dart
final response = await groupsApi.getGroups();
final groups = response.data!; // List<Group>
```

#### Create Expense
```dart
final response = await expensesApi.createExpense(
  groupId: 'group-id',
  body: CreateExpenseRequest(
    description: 'Dinner',
    amount: 50.00,
    paidById: 'user-id',
    splits: [
      ExpenseSplit(userId: 'user1', amount: 25.00),
      ExpenseSplit(userId: 'user2', amount: 25.00),
    ],
  ),
);

final expense = response.data!;
```

## Regenerating the Client

**When to regenerate:**
- After adding new API endpoints
- After modifying request/response schemas
- After changing validation rules

**How to regenerate:**
```bash
cd server
npm run generate:dart-client
```

Then in your Flutter app:
```bash
cd mobile
flutter pub get
dart run build_runner build --delete-conflicting-outputs
```

## Integration with Riverpod

The generated client will be wrapped in Riverpod providers (see `lib/providers/api_provider.dart`):

```dart
@riverpod
Dio dio(DioRef ref) {
  final authState = ref.watch(authProvider);
  
  final dio = Dio(BaseOptions(
    baseUrl: AppConfig.apiBaseUrl,
    headers: {
      if (authState.accessToken != null)
        'Authorization': 'Bearer ${authState.accessToken}',
    },
  ));
  
  // Add interceptors for error handling, token refresh, logging
  dio.interceptors.add(AuthInterceptor(ref));
  
  return dio;
}

@riverpod
GroupsApi groupsApi(GroupsApiRef ref) {
  return GroupsApi(ref.watch(dioProvider));
}

// Similar providers for other APIs...
```

Usage in widgets:
```dart
final groupsApi = ref.watch(groupsApiProvider);
final groups = await groupsApi.getGroups();
```

## Troubleshooting

### Error: "Module not found: @asteasolutions/zod-to-openapi"

The package name in `package.json` is `zod-to-openapi`, not `@asteasolutions/zod-to-openapi`.

**Fix:** Update import in `server/src/openapi/generate.ts`:
```dart
import { OpenAPIRegistry, OpenApiGeneratorV3 } from 'zod-to-openapi';
```

### Error: "openapi.json not found"

Run the OpenAPI generation first:
```bash
cd server
npm run generate:openapi
```

### Generated code has compilation errors

1. Clean and regenerate:
   ```bash
   cd server
   rm -rf ../mobile/lib/api
   npm run generate:dart-client
   ```

2. In Flutter app:
   ```bash
   cd mobile
   flutter clean
   flutter pub get
   ```

### Type mismatches in generated models

The OpenAPI spec might have incorrect schemas. Check:
1. `server/src/routes/validation/*.schema.ts` - Zod schemas
2. `server/openapi.json` - Generated spec
3. Update schemas and regenerate

### Want to customize generated code

**Option 1:** Modify generator config in `package.json`:
```json
"generate:dart-client": "openapi-generator-cli generate -i openapi.json -g dart-dio -o ../mobile/lib/api --additional-properties=pubName=splitwise_api,nullableFields=true,..."
```

**Option 2:** Create custom templates (advanced):
```bash
openapi-generator-cli author template -g dart-dio
```

## Manual Alternative (Not Recommended)

If code generation doesn't work, you can manually create API client using Retrofit:

```dart
@RestApi(baseUrl: "http://localhost:3000")
abstract class ApiClient {
  factory ApiClient(Dio dio, {String baseUrl}) = _ApiClient;

  @POST("/api/auth/login")
  Future<LoginResponse> login(@Body() LoginRequest request);

  @GET("/api/groups")
  Future<List<Group>> getGroups();
  
  // ... define all endpoints manually
}
```

But this loses the benefit of automatic sync with backend schemas.

## Next Steps

After generating the client:
1. **Task #4**: Create Riverpod providers to wrap the generated APIs
2. **Task #5**: Implement Socket.io provider for real-time sync
3. **Task #6**: Build authentication screens that use the generated `AuthenticationApi`

---

**Summary:**
```bash
# One-time setup
cd server && npm install

# Generate client (run whenever backend API changes)
cd server && npm run generate:dart-client

# Use in Flutter
cd mobile && flutter pub get
```
