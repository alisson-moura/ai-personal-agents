import { and, gte, lt } from 'drizzle-orm';
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';
import { db } from '#app/database/index.ts';
import { schema } from '#app/database/schema/index.ts';

export const getTransactions: FastifyPluginCallbackZod = (app, _, done) => {
  app.get(
    '/transactions',
    {
      schema: {
        querystring: z.object({
          start_date: z.iso.date(),
          end_date: z.iso.date(),
        }),
      },
    },
    async (request, reply) => {
      const data = request.query;

      const results = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            gte(
              schema.transactions.transactionDate,
              data.start_date.toString()
            ),
            lt(schema.transactions.transactionDate, data.end_date.toString())
          )
        );

      return reply.send({ transactions: results });
    }
  );

  done();
};
