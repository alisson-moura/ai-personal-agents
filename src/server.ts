import cors from '@fastify/cors';
import Fastify from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';

const fastify = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
fastify.register(cors, { origin: '*' });

fastify.setValidatorCompiler(validatorCompiler);
fastify.setSerializerCompiler(serializerCompiler);

fastify.get('/', function handler() {
  return { hello: 'world' };
});

try {
  await fastify.listen({ port: 3000 });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
