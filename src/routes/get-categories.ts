import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod';
import { db } from '#app/database/index.ts';
import { schema } from '#app/database/schema/index.ts';

export const getCategoriesRoute: FastifyPluginCallbackZod = (app) => {
  app.get('/categories', async () => {
    const results = await db
      .select()
      .from(schema.categories)
      .orderBy(schema.categories.name);
    return results;
  });
};
