import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  MONGODB_URI: Joi.string().required(),
  MONGODB_MAX_POOL_SIZE: Joi.number().default(10),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),

  // Redis
  REDIS_ENABLED: Joi.boolean().default(false),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // CORS
  FRONTEND_CLIENT_URL: Joi.string().uri().required(),
  FRONTEND_ADMIN_URL: Joi.string().uri().required(),

  // Cloudinary (optional in test environment)
  CLOUDINARY_CLOUD_NAME: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('<your-cloud-name>'),
    otherwise: Joi.string().required(),
  }),
  CLOUDINARY_API_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('<your-api-key>'),
    otherwise: Joi.string().required(),
  }),
  CLOUDINARY_API_SECRET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('<your-api-secret>'),
    otherwise: Joi.string().required(),
  }),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
