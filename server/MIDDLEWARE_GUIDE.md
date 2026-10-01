# Authorization Middleware Stack Guide

This document explains the composable middleware stack and how to apply it to routes.

## Available Middleware

### 1. `authenticate` (auth.middleware.ts)
**Purpose**: Verify JWT access token and attach `req.user`  
**Usage**: Apply to any route that requires a logged-in user  
**Throws**: 401 if token is missing, invalid, or expired

```typescript
import { authenticate } from '../middleware/auth.middleware';

router.get('/protected', authenticate, controller.method);
```

**Attaches to Request**:
```typescript
req.user = {
  id: string;
  email: string;
  name: string;
}
```

---

### 2. `requireGroupMembership` (group.middleware.ts)
**Purpose**: Verify user is a member of the group in `req.params.id` or `req.params.groupId`  
**Dependencies**: Must run after `authenticate`  
**Usage**: Apply to any route scoped to a specific group  
**Throws**: 403 if user is not a group member

```typescript
import { authenticate } from '../middleware/auth.middleware';
import { requireGroupMembership } from '../middleware/group.middleware';

router.get(
  '/groups/:id/expenses',
  authenticate,
  requireGroupMembership,
  expenseController.list
);
```

**Attaches to Request**:
```typescript
req.membership = {
  id: string;
  groupId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: Date;
}
```

---

### 3. `requireGroupOwner` (group.middleware.ts)
**Purpose**: Verify user is the owner of the group  
**Dependencies**: Must run after `requireGroupMembership`  
**Usage**: Apply to owner-only actions (delete group, remove members, etc.)  
**Throws**: 403 if user is not the owner

```typescript
router.delete(
  '/groups/:id',
  authenticate,
  requireGroupMembership,
  requireGroupOwner,
  groupController.delete
);
```

---

### 4. `requireExpenseModifyPermission` (group.middleware.ts)
**Purpose**: Verify user can edit/delete an expense (creator OR group owner)  
**Dependencies**: Must run after `requireGroupMembership`  
**Usage**: Apply to expense edit/delete routes  
**Throws**: 403 if user is neither the creator nor the owner

```typescript
router.patch(
  '/groups/:id/expenses/:expenseId',
  authenticate,
  requireGroupMembership,
  requireExpenseModifyPermission,
  expenseController.update
);

router.delete(
  '/groups/:id/expenses/:expenseId',
  authenticate,
  requireGroupMembership,
  requireExpenseModifyPermission,
  expenseController.delete
);
```

---

### 5. `requireCommentDeletePermission` (group.middleware.ts)
**Purpose**: Verify user can delete a comment (author OR group owner)  
**Dependencies**: Must run after `requireGroupMembership`  
**Usage**: Apply to comment delete routes  
**Throws**: 403 if user is neither the author nor the owner

```typescript
router.delete(
  '/groups/:id/expenses/:expenseId/comments/:commentId',
  authenticate,
  requireGroupMembership,
  requireCommentDeletePermission,
  commentController.delete
);
```

---

### 6. `requireSettlementParticipant` (group.middleware.ts)
**Purpose**: Verify user is one of the parties in a settlement (`fromUserId` or `toUserId`)  
**Dependencies**: Must run after `requireGroupMembership`  
**Usage**: Apply to settlement creation routes  
**Throws**: 403 if user is not a participant

```typescript
router.post(
  '/groups/:id/settlements',
  authenticate,
  requireGroupMembership,
  requireSettlementParticipant,
  settlementController.create
);
```

---

### 7. Validation Middleware (validate.middleware.ts)
**Purpose**: Validate and parse request data with Zod schemas  
**Available**: `validateBody`, `validateParams`, `validateQuery`  
**Usage**: Apply before controller to ensure type-safe input

```typescript
import { validateBody } from '../middleware/validate.middleware';
import { createExpenseSchema } from './validation/expense.schema';

router.post(
  '/groups/:id/expenses',
  authenticate,
  requireGroupMembership,
  validateBody(createExpenseSchema),
  expenseController.create
);
```

---

## Middleware Composition Examples

### Example 1: Public Route (no auth)
```typescript
router.post('/auth/login', authController.login);
```

### Example 2: Authenticated Route
```typescript
router.get('/me', authenticate, userController.getMe);
```

### Example 3: Group Member Route
```typescript
router.get(
  '/groups/:id',
  authenticate,
  requireGroupMembership,
  groupController.getOne
);
```

### Example 4: Owner-Only Route
```typescript
router.delete(
  '/groups/:id',
  authenticate,
  requireGroupMembership,
  requireGroupOwner,
  groupController.delete
);
```

### Example 5: Expense Modification Route
```typescript
router.patch(
  '/groups/:id/expenses/:expenseId',
  authenticate,
  requireGroupMembership,
  requireExpenseModifyPermission,
  validateBody(updateExpenseSchema),
  expenseController.update
);
```

### Example 6: Full Stack with Validation
```typescript
router.post(
  '/groups/:id/settlements',
  authenticate,
  requireGroupMembership,
  requireSettlementParticipant,
  validateBody(createSettlementSchema),
  settlementController.create
);
```

---

## Authorization Rules Summary

| Route | Auth | Group Member | Owner | Expense Creator | Notes |
|-------|------|--------------|-------|-----------------|-------|
| POST /auth/login | ❌ | N/A | N/A | N/A | Public |
| GET /me | ✅ | N/A | N/A | N/A | Own profile |
| GET /groups/:id | ✅ | ✅ | ❌ | N/A | Any member |
| PATCH /groups/:id | ✅ | ✅ | ✅ | N/A | Owner only |
| DELETE /groups/:id | ✅ | ✅ | ✅ | N/A | Owner only |
| POST /groups/:id/expenses | ✅ | ✅ | ❌ | N/A | Any member |
| PATCH /groups/:id/expenses/:id | ✅ | ✅ | Creator OR Owner | ✅ | Creator or owner |
| DELETE /groups/:id/expenses/:id | ✅ | ✅ | Creator OR Owner | ✅ | Creator or owner |
| DELETE /groups/:id/members/:userId | ✅ | ✅ | ✅ | N/A | Owner only (except self) |
| POST /groups/:id/settlements | ✅ | ✅ | Must be participant | N/A | fromUserId or toUserId |

---

## Best Practices

1. **Always chain middleware in order**: `authenticate` → `requireGroupMembership` → specific permission check
2. **Use validation middleware** before controllers to ensure type-safe inputs
3. **Never skip `authenticate`** on protected routes — no default-open routes
4. **Keep authorization logic in middleware**, not scattered in controllers/services
5. **Fail fast with 401/403** — never let unauthorized requests reach business logic
6. **Test middleware composition** with integration tests for each permission combination

---

## Error Responses

All middleware throw structured errors that the error handler converts to consistent JSON:

**401 Unauthorized** (missing/invalid token):
```json
{
  "error": "UnauthorizedError",
  "message": "No authorization token provided"
}
```

**403 Forbidden** (insufficient permissions):
```json
{
  "error": "ForbiddenError",
  "message": "You are not a member of this group"
}
```

**400 Validation Error** (invalid input):
```json
{
  "error": "Validation failed",
  "message": "Name must be at least 2 characters",
  "details": [...]
}
```
