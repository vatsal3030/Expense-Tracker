import { createMicroservice } from './base.service';
import { notificationRouter } from '../routes/notification.routes';
import { activityRouter } from '../routes/activity.routes';
import { adminRouter } from '../routes/admin.routes';
import { initSocket } from '../lib/socket';

// =============================================================================
// REAL-TIME & NOTIFICATION MICROSERVICE
// Handles: In-app Notifications, Activity Audit Stream, Admin Ops, Real-time WebSockets
// =============================================================================
export const notificationService = createMicroservice({
  serviceName: 'notification-service',
  defaultPort: 5004,
  routes: [
    { path: '/api/notifications', router: notificationRouter },
    { path: '/api/activities', router: activityRouter },
    { path: '/api/admin', router: adminRouter },
  ],
  setupCustom: (_app, server) => {
    // Attach Socket.io WebSocket server
    initSocket(server);
    console.log('    ⚡ Real-time WebSocket Gateway attached to Notification Service');
  },
});
