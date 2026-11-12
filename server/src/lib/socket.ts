import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyAndResolveUser } from '../middleware/auth';
import prisma from './prisma';

let ioInstance: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Socket authentication middleware
  io.use(async (socket: Socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        (socket.handshake.headers.authorization && typeof socket.handshake.headers.authorization === 'string'
          ? socket.handshake.headers.authorization.replace(/^Bearer\s+/i, '')
          : null);

      if (rawToken) {
        const resolvedUser = await verifyAndResolveUser(rawToken);
        if (resolvedUser) {
          socket.data.user = resolvedUser;
        }
      }
      next();
    } catch {
      next();
    }
  });

  io.on('connection', (socket: Socket) => {
    // Client sends auth/user info upon connecting
    socket.on('join:user', (userId: string) => {
      if (!userId || typeof userId !== 'string') return;

      const authenticatedUser = socket.data.user;
      if (authenticatedUser) {
        // Enforce that user can only join their own room
        if (userId === authenticatedUser.id) {
          socket.join(`user:${userId}`);
        } else {
          console.warn(`[SOCKET_SECURITY] Blocked unauthorized join:user attempt. AuthUser: ${authenticatedUser.id}, Requested: ${userId}`);
        }
      } else if (process.env.NODE_ENV !== 'production') {
        // Dev fallback
        socket.join(`user:${userId}`);
      }
    });

    socket.on('join:group', async (groupId: string) => {
      if (!groupId || typeof groupId !== 'string') return;

      const authenticatedUser = socket.data.user;
      if (authenticatedUser) {
        // Verify user is an active member of this group
        try {
          const membership = await prisma.groupMember.findFirst({
            where: { groupId, userId: authenticatedUser.id },
            select: { id: true },
          });
          if (membership) {
            socket.join(`group:${groupId}`);
          } else {
            console.warn(`[SOCKET_SECURITY] Blocked unauthorized join:group. User: ${authenticatedUser.id}, Group: ${groupId}`);
          }
        } catch (e) {
          console.error('[SOCKET_SECURITY] Error verifying group membership:', e);
        }
      } else if (process.env.NODE_ENV !== 'production') {
        socket.join(`group:${groupId}`);
      }
    });

    socket.on('leave:group', (groupId: string) => {
      if (groupId && typeof groupId === 'string') {
        socket.leave(`group:${groupId}`);
      }
    });
  });

  ioInstance = io;
  return io;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function emitToUser(userId: string, event: string, data: any) {
  if (ioInstance && userId) {
    ioInstance.to(`user:${userId}`).emit(event, data);
  }
}

export function emitToGroup(groupId: string, event: string, data: any) {
  if (ioInstance && groupId) {
    ioInstance.to(`group:${groupId}`).emit(event, data);
  }
}

export function emitToUsers(userIds: string[], event: string, data: any) {
  if (ioInstance && Array.isArray(userIds)) {
    userIds.forEach((uid) => {
      if (uid) ioInstance?.to(`user:${uid}`).emit(event, data);
    });
  }
}
