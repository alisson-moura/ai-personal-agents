import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { db } from '../database/index';
import { schema } from '../database/schema/index';

export const getCategoriesRoute: FastifyPluginCallbackZod = (app) => {
  app.get('/categories', async () => {
    const results = await db
      .select()
      .from(schema.categories)
      .orderBy(schema.categories.name);
    return results;
  });
};
