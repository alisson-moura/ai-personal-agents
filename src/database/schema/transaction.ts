import { relations } from 'drizzle-orm';
import {
  date,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const transactionTypeEnum = pgEnum('transaction_type', [
  'income',
  'expense',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'pix',
  'credit_card',
  'debit_card',
  'cash',
  'bank_transfer',
  'other',
]);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text(),
  icon: text('icon'),
  color: text('color'),
});

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  amountInCents: integer('amount_in_cents').notNull(),
  description: text('description').notNull(),
  type: transactionTypeEnum('type').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').notNull(),
  transactionDate: date('transaction_date', { mode: 'string' }).notNull(),
  categoryId: integer('category_id').references(() => categories.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
