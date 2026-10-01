import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { env } from '../utils/env';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export class SocketService {
  private io: Server;

  constructor(httpServer: HTTPServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: [env.WEB_APP_URL, env.APP_URL],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupConnectionHandler();

    logger.info('Socket.io server initialized');
  }

  /**
   * Authentication middleware
   * Verifies JWT token and attaches user info to socket
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Get token from handshake auth or query
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '') ||
          socket.handshake.query.token;

        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT
        const payload = verifyAccessToken(token);

        // Attach user info to socket
        socket.userId = payload.userId;
        socket.userEmail = payload.email;
        socket.userName = payload.name;

        logger.debug(
          { userId: payload.userId, socketId: socket.id },
          'Socket authenticated'
        );

        next();
      } catch (error) {
        logger.error({ error }, 'Socket authentication failed');
        next(new Error('Invalid authentication token'));
      }
    });
  }

  /**
   * Handle new socket connections
   */
  private setupConnectionHandler() {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;

      logger.info(
        { userId, socketId: socket.id },
        'User connected via Socket.io'
      );

      // Join personal room (for user-specific notifications)
      socket.join(`user:${userId}`);

      // Join all groups the user belongs to
      await this.joinUserGroups(socket, userId);

      // Handle manual group join (when user navigates to a group)
      socket.on('join-group', async (groupId: string) => {
        await this.handleJoinGroup(socket, userId, groupId);
      });

      // Handle manual group leave
      socket.on('leave-group', (groupId: string) => {
        socket.leave(`group:${groupId}`);
        logger.debug(
          { userId, groupId, socketId: socket.id },
          'User left group room'
        );
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(
          { userId, socketId: socket.id },
          'User disconnected from Socket.io'
        );
      });

      // Send connection confirmation
      socket.emit('connected', {
        userId,
        message: 'Connected to real-time updates',
      });
    });
  }

  /**
   * Join all groups the user is a member of
   */
  private async joinUserGroups(socket: AuthenticatedSocket, userId: string) {
    try {
      const memberships = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      });

      for (const membership of memberships) {
        socket.join(`group:${membership.groupId}`);
      }

      logger.debug(
        { userId, groupCount: memberships.length },
        'User joined group rooms'
      );
    } catch (error) {
      logger.error({ error, userId }, 'Failed to join user groups');
    }
  }

  /**
   * Handle explicit group join request
   */
  private async handleJoinGroup(
    socket: AuthenticatedSocket,
    userId: string,
    groupId: string
  ) {
    try {
      // Verify user is a member of this group
      const membership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId,
          },
        },
      });

      if (!membership) {
        socket.emit('error', {
          message: 'You are not a member of this group',
          code: 'NOT_MEMBER',
        });
        return;
      }

      socket.join(`group:${groupId}`);

      logger.debug(
        { userId, groupId, socketId: socket.id },
        'User joined group room'
      );

      socket.emit('joined-group', { groupId });
    } catch (error) {
      logger.error({ error, userId, groupId }, 'Failed to join group');
      socket.emit('error', {
        message: 'Failed to join group',
        code: 'JOIN_FAILED',
      });
    }
  }

  /**
   * Emit event to a specific group
   */
  emitToGroup(groupId: string, event: string, data: unknown) {
    this.io.to(`group:${groupId}`).emit(event, data);
    logger.debug({ groupId, event }, 'Event emitted to group');
  }

  /**
   * Emit event to a specific user
   */
  emitToUser(userId: string, event: string, data: unknown) {
    this.io.to(`user:${userId}`).emit(event, data);
    logger.debug({ userId, event }, 'Event emitted to user');
  }

  /**
   * Emit event to multiple users
   */
  emitToUsers(userIds: string[], event: string, data: unknown) {
    userIds.forEach(userId => {
      this.io.to(`user:${userId}`).emit(event, data);
    });
    logger.debug({ userCount: userIds.length, event }, 'Event emitted to users');
  }

  /**
   * Check if user is currently connected
   */
  async isUserConnected(userId: string): Promise<boolean> {
    const sockets = await this.io.in(`user:${userId}`).fetchSockets();
    return sockets.length > 0;
  }

  /**
   * Get Socket.io server instance (for integration with Express routes)
   */
  getIO(): Server {
    return this.io;
  }
}

// Singleton instance
let socketService: SocketService | null = null;

export const initializeSocket = (httpServer: HTTPServer): SocketService => {
  if (socketService) {
    return socketService;
  }
  socketService = new SocketService(httpServer);
  return socketService;
};

export const getSocketService = (): SocketService => {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
};
