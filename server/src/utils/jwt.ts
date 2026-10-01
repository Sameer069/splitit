import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from './env';
import { UnauthorizedError } from './errors';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Generate access token (short-lived)
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
};

// Generate both tokens at once
export const generateTokenPair = (payload: JwtPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

// Verify access token
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid access token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid refresh token');
    }
    throw new UnauthorizedError('Token verification failed');
  }
};

// Hash a token for storage (never store raw tokens)
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Generate secure random token for invites/password reset
export const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};
