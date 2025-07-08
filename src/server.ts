import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { env } from './env.ts';
import { getCategoriesRoute } from './routes/get-categories.ts';

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
fastify.register(cors, { origin: '*' });

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

fastify.register(getCategoriesRoute);

try {
  await fastify.listen({ port: env.HTTP_PORT });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
