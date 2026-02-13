import { pgTable, text, uuid, timestamp, varchar, decimal, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { groups, users } from './schema-auth';
import { matches } from './schema-matches';

// Enum para categorias de despesa
export const expenseCategoryEnum = pgEnum('expense_category', [
  'MEAT',        // Carnes
  'DRINKS',      // Bebidas
  'SIDES',       // Acompanhamentos
  'ICE',         // Gelo
  'CHARCOAL',    // Carvão
  'OTHER'        // Outro
]);

// Tabela de despesas de churrasco
export const barbecueExpenses = pgTable(
  'barbecue_expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    paidBy: uuid('paid_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
    category: varchar('category', { length: 50 }).notNull(), // MEAT, DRINKS, SIDES, ICE, CHARCOAL, OTHER
    description: varchar('description', { length: 255 }).notNull(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    splitBetween: integer('split_between').notNull().default(1), // Quantas pessoas dividem
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_barbecue_expenses_group_id').on(table.groupId),
    matchIdIdx: index('idx_barbecue_expenses_match_id').on(table.matchId),
    paidByIdx: index('idx_barbecue_expenses_paid_by').on(table.paidBy),
  })
);

// Tabela de débitos/créditos de churrasco
export const barbecueDebts = pgTable(
  'barbecue_debts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    debtor: uuid('debtor').notNull().references(() => users.id, { onDelete: 'cascade' }),
    creditor: uuid('creditor').notNull().references(() => users.id, { onDelete: 'cascade' }),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    isPaid: boolean('is_paid').default(false),
    paidAt: timestamp('paid_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_barbecue_debts_group_id').on(table.groupId),
    matchIdIdx: index('idx_barbecue_debts_match_id').on(table.matchId),
    debtorIdx: index('idx_barbecue_debts_debtor').on(table.debtor),
    creditorIdx: index('idx_barbecue_debts_creditor').on(table.creditor),
  })
);

// Relações
export const barbecueExpensesRelations = relations(barbecueExpenses, ({ one, many }) => ({
  group: one(groups, {
    fields: [barbecueExpenses.groupId],
    references: [groups.id],
  }),
  match: one(matches, {
    fields: [barbecueExpenses.matchId],
    references: [matches.id],
  }),
  paidByUser: one(users, {
    fields: [barbecueExpenses.paidBy],
    references: [users.id],
  }),
}));

export const barbecueDebtsRelations = relations(barbecueDebts, ({ one }) => ({
  group: one(groups, {
    fields: [barbecueDebts.groupId],
    references: [groups.id],
  }),
  match: one(matches, {
    fields: [barbecueDebts.matchId],
    references: [matches.id],
  }),
  debtorUser: one(users, {
    fields: [barbecueDebts.debtor],
    references: [users.id],
  }),
  creditorUser: one(users, {
    fields: [barbecueDebts.creditor],
    references: [users.id],
  }),
}));
