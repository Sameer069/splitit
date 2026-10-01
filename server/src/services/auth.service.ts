import { OAuth2Client } from 'google-auth-library';
import { AuthProvider } from '@prisma/client';
import { authRepository } from '../repositories/auth.repository';
import { hashPassword, verifyPassword } from '../utils/password';
import {
  generateTokenPair,
  generateSecureToken,
  hashToken,
  verifyRefreshToken,
  JwtPayload,
  TokenPair,
} from '../utils/jwt';
import {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors';
import { env } from '../utils/env';
import { emailService } from './email.service';
import { logger } from '../utils/logger';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    authProvider: AuthProvider;
    createdAt: Date;
  };
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  // Register with email/password
  async register(
    name: string,
    email: string,
    password: string
  ): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await authRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await authRepository.createUser({
      name,
      email,
      passwordHash,
      authProvider: AuthProvider.EMAIL,
    });

    // Generate tokens
    const tokens = this.generateAndStoreTokens(user.id, user.email, user.name);

    // Send welcome email (non-blocking)
    emailService.sendWelcomeEmail(email, name).catch(err => {
      logger.error({ err, email }, 'Failed to send welcome email');
    });

    logger.info({ userId: user.id, email }, 'User registered successfully');

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
      ...(await tokens),
    };
  }

  // Login with email/password
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user has a password (might be Google-only account)
    if (!user.passwordHash) {
      throw new UnauthorizedError(
        'This account uses Google Sign-In. Please sign in with Google.'
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.name);

    logger.info({ userId: user.id, email }, 'User logged in successfully');

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  // Google Sign-In
  async googleSignIn(idToken: string): Promise<AuthResult> {
    // Verify ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedError('Invalid Google ID token');
    }

    const { sub: googleId, email, name, picture } = payload;

    if (!email || !name) {
      throw new ValidationError('Google account must have email and name');
    }

    // Check if user exists by Google ID
    let user = await authRepository.findUserByGoogleId(googleId);

    if (user) {
      // Existing Google user - just log them in
      logger.info({ userId: user.id, email }, 'User logged in with Google');
    } else {
      // Check if user with this email exists (might have registered with email/password)
      const existingEmailUser = await authRepository.findUserByEmail(email);

      if (existingEmailUser) {
        // Link Google account to existing user
        user = await authRepository.linkGoogleAccount(existingEmailUser.id, googleId);
        logger.info({ userId: user.id, email }, 'Linked Google account to existing user');
      } else {
        // Create new user with Google
        user = await authRepository.createUser({
          name,
          email,
          googleId,
          authProvider: AuthProvider.GOOGLE,
          avatarUrl: picture || undefined,
        });

        // Send welcome email (non-blocking)
        emailService.sendWelcomeEmail(email, name).catch(err => {
          logger.error({ err, email }, 'Failed to send welcome email');
        });

        logger.info({ userId: user.id, email }, 'New user registered with Google');
      }
    }

    // Generate tokens
    const tokens = await this.generateAndStoreTokens(user.id, user.email, user.name);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
      ...tokens,
    };
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Hash the token to find it in DB
    const tokenHash = hashToken(refreshToken);
    const storedToken = await authRepository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token is revoked
    if (storedToken.revokedAt) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Revoke old refresh token (rotation)
    await authRepository.revokeRefreshToken(tokenHash);

    // Generate new token pair
    const tokens = await this.generateAndStoreTokens(
      payload.userId,
      payload.email,
      payload.name
    );

    logger.info({ userId: payload.userId }, 'Access token refreshed');

    return tokens;
  }

  // Logout (revoke refresh token)
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    
    try {
      await authRepository.revokeRefreshToken(tokenHash);
      logger.info('User logged out successfully');
    } catch (error) {
      // Token might not exist or already revoked - that's fine
      logger.warn({ error }, 'Logout called with invalid/revoked token');
    }
  }

  // Forgot password - send reset email
  async forgotPassword(email: string): Promise<void> {
    const user = await authRepository.findUserByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      logger.info({ email }, 'Password reset requested for non-existent email');
      return;
    }

    // Check if user can reset password (must have password set)
    if (!user.passwordHash) {
      logger.info({ email }, 'Password reset requested for Google-only account');
      // Still return success to prevent enumeration
      return;
    }

    // Generate reset token
    const resetToken = generateSecureToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await authRepository.createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // Send email
    await emailService.sendPasswordResetEmail(email, resetToken);

    logger.info({ userId: user.id, email }, 'Password reset email sent');
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const resetToken = await authRepository.findPasswordResetToken(tokenHash);

    if (!resetToken) {
      throw new NotFoundError('Invalid or expired reset token');
    }

    // Check if already used
    if (resetToken.usedAt) {
      throw new ForbiddenError('Reset token has already been used');
    }

    // Check if expired
    if (resetToken.expiresAt < new Date()) {
      throw new ForbiddenError('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await authRepository.updatePassword(resetToken.userId, passwordHash);

    // Mark token as used
    await authRepository.markPasswordResetTokenUsed(resetToken.id);

    // Revoke all existing refresh tokens (force re-login everywhere)
    await authRepository.revokeAllUserRefreshTokens(resetToken.userId);

    logger.info({ userId: resetToken.userId }, 'Password reset successfully');
  }

  // Change password (while logged in)
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await authRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user has a password (might be Google-only)
    if (!user.passwordHash) {
      throw new ForbiddenError(
        'Cannot set password for Google-only accounts. Use "Set Password" flow instead.'
      );
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await authRepository.updatePassword(userId, passwordHash);

    logger.info({ userId }, 'Password changed successfully');
  }

  // Helper: Generate and store token pair
  private async generateAndStoreTokens(
    userId: string,
    email: string,
    name: string
  ): Promise<TokenPair> {
    const payload: JwtPayload = { userId, email, name };
    const tokens = generateTokenPair(payload);

    // Store refresh token hash
    const tokenHash = hashToken(tokens.refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await authRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt,
    });

    return tokens;
  }
}

export const authService = new AuthService();
