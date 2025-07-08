import { z } from 'zod';

const envSchema = z.object({
  HTTP_PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
