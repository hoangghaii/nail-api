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

  // Firebase (optional in test environment)
  FIREBASE_PROJECT_ID: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('test-project'),
    otherwise: Joi.string().required(),
  }),
  FIREBASE_PRIVATE_KEY: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('<from-service-account-json>'),
    otherwise: Joi.string().required(),
  }),
  FIREBASE_CLIENT_EMAIL: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('test@test.iam.gserviceaccount.com'),
    otherwise: Joi.string().email().required(),
  }),
  FIREBASE_STORAGE_BUCKET: Joi.string().when('NODE_ENV', {
    is: 'test',
    then: Joi.string().default('test-bucket.appspot.com'),
    otherwise: Joi.string().required(),
  }),

  // Rate Limiting
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
});
