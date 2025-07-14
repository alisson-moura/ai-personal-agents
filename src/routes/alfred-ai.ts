import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';
import { executeAlfredAgent } from '../agents/alfred';

export const alfredAI: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/ai/alfred',
    {
      schema: {
        body: z.object({
          mensagem: z
            .string()
            .min(2, { message: 'O campo mensagem não pode ser vazio.' }),
        }),
      },
    },
    async (request, reply) => {
      const { mensagem } = request.body;

      const response = await executeAlfredAgent(mensagem);

      return reply.status(200).send({
        reply: response,
      });
    }
  );
};
