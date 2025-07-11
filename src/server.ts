import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { env } from './env';
import { client } from './lib/whatsapp';
import { alfredAI } from './routes/alfred-ai';
import { createTransaction } from './routes/create-transaction';
import { getCategoriesRoute } from './routes/get-categories';
import { getTransactions } from './routes/get-transactions';

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
fastify.register(cors, { origin: '*' });

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

fastify.register(getCategoriesRoute);
fastify.register(createTransaction);
fastify.register(getTransactions);
fastify.register(alfredAI);

fastify
  .listen({ port: env.HTTP_PORT })
  .then(() => {
    client.initialize();
  })
  .catch((err) => {
    fastify.log.error(err);
    process.exit(1);
  });
