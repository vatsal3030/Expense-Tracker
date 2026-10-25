import { createMicroservice } from './base.service';
import { authRouter } from '../routes/auth.routes';
import { userRouter } from '../routes/user.routes';
import { friendRouter } from '../routes/friend.routes';

// =============================================================================
// IDENTITY & SOCIAL MICROSERVICE
// Handles: User Registration, Login, JWT Issuance, Profile, Friends
// =============================================================================
export const identityService = createMicroservice({
  serviceName: 'identity-service',
  defaultPort: 5001,
  routes: [
    { path: '/api/auth', router: authRouter },
    { path: '/api/users', router: userRouter },
    { path: '/api/friends', router: friendRouter },
  ],
});
