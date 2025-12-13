import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  frontendUrls: {
    client: process.env.FRONTEND_CLIENT_URL,
    admin: process.env.FRONTEND_ADMIN_URL,
  },
}));
