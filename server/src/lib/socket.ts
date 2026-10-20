import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

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

  io.on('connection', (socket: Socket) => {
    // Client sends auth/user info upon connecting
    socket.on('join:user', (userId: string) => {
      if (userId && typeof userId === 'string') {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('join:group', (groupId: string) => {
      if (groupId && typeof groupId === 'string') {
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
