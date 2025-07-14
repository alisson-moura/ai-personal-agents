import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import z from 'zod/v4';
import { db } from '../database/index';
import { schema } from '../database/schema/index';

export const createTransaction: FastifyPluginCallbackZod = (app, _, done) => {
  app.post(
    '/transactions',
    {
      schema: {
        body: z.object({
          categoryId: z.number().int().positive(),
          amount: z.number().int().positive(),
          description: z.string().min(1),
          paymentMethod: z.enum(schema.paymentMethodEnum.enumValues),
          transactionDate: z.iso.date(),
          type: z.enum(schema.transactionTypeEnum.enumValues),
        }),
      },
    },
    async (request, reply) => {
      const data = request.body;

      const result = await db
        .insert(schema.transactions)
        .values({
          amountInCents: data.amount,
          description: data.description,
          paymentMethod: data.paymentMethod,
          transactionDate: data.transactionDate,
          categoryId: data.categoryId,
          type: data.type,
        })
        .returning();

      const insertedRow = result[0];

      if (!insertedRow) {
        throw new Error('Failed to create a new transaction.');
      }

      return reply.status(201).send({ id: insertedRow.id });
    }
  );

  done();
};
