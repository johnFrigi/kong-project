import { registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: '.env' });

export default registerAs('jwt', () => ({
  jwtSecret: process.env.JWT_SECRET,
}));
