import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { env } from './env.ts';
import { createTransaction } from './routes/create-transaction.ts';
import { getCategoriesRoute } from './routes/get-categories.ts';
import { getTransactions } from './routes/get-transactions.ts';

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
fastify.register(cors, { origin: '*' });

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

fastify.register(getCategoriesRoute);
fastify.register(createTransaction);
fastify.register(getTransactions);

try {
  await fastify.listen({ port: env.HTTP_PORT });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
