import { pgTable, text, uuid, timestamp, varchar, decimal, boolean, enum as pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { groups, users } from './schema-auth';
import { matches, attendance } from './schema-matches';

// Enum para status de pagamento
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED', 'CANCELLED']);

// Enum para tipo de pagamento
export const paymentTypeEnum = pgEnum('payment_type', ['PIX', 'BOLETO']);

// Tabela de configuração Asaas por grupo
export const asaasConfig = pgTable(
  'asaas_config',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().unique().references(() => groups.id, { onDelete: 'cascade' }),
    apiKey: varchar('api_key', { length: 255 }).notNull(),
    environment: varchar('environment', { length: 50 }).default('sandbox'), // sandbox ou production
    webhookSecret: varchar('webhook_secret', { length: 255 }),
    pixKey: varchar('pix_key', { length: 255 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_asaas_config_group_id').on(table.groupId),
  })
);

// Tabela de pagamentos
export const asaasPayments = pgTable(
  'asaas_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    attendanceId: uuid('attendance_id').notNull().references(() => attendance.id, { onDelete: 'cascade' }),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    asaasChargeId: varchar('asaas_charge_id', { length: 255 }).unique(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentType: varchar('payment_type', { length: 50 }).default('PIX'), // PIX ou BOLETO
    status: varchar('status', { length: 50 }).default('PENDING'), // PENDING, CONFIRMED, FAILED, REFUNDED, CANCELLED
    pixQrCode: text('pix_qr_code'),
    pixCopiaeCola: text('pix_copia_e_cola'),
    barcodeNumber: varchar('barcode_number', { length: 255 }),
    dueDate: timestamp('due_date'),
    confirmedAt: timestamp('confirmed_at'),
    failedAt: timestamp('failed_at'),
    failureReason: text('failure_reason'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_asaas_payments_group_id').on(table.groupId),
    attendanceIdIdx: index('idx_asaas_payments_attendance_id').on(table.attendanceId),
    matchIdIdx: index('idx_asaas_payments_match_id').on(table.matchId),
    playerIdIdx: index('idx_asaas_payments_player_id').on(table.playerId),
    statusIdx: index('idx_asaas_payments_status').on(table.status),
    asaasChargeIdIdx: index('idx_asaas_payments_asaas_charge_id').on(table.asaasChargeId),
  })
);

// Tabela de webhooks Asaas
export const webhookLogs = pgTable(
  'webhook_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    event: varchar('event', { length: 255 }).notNull(),
    asaasChargeId: varchar('asaas_charge_id', { length: 255 }),
    payload: text('payload'),
    isValid: boolean('is_valid').default(false),
    processed: boolean('processed').default(false),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_webhook_logs_group_id').on(table.groupId),
    eventIdx: index('idx_webhook_logs_event').on(table.event),
    asaasChargeIdIdx: index('idx_webhook_logs_asaas_charge_id').on(table.asaasChargeId),
  })
);

// Relações
export const asaasConfigRelations = relations(asaasConfig, ({ one, many }) => ({
  group: one(groups, {
    fields: [asaasConfig.groupId],
    references: [groups.id],
  }),
  payments: many(asaasPayments),
}));

export const asaasPaymentsRelations = relations(asaasPayments, ({ one }) => ({
  group: one(groups, {
    fields: [asaasPayments.groupId],
    references: [groups.id],
  }),
  attendance: one(attendance, {
    fields: [asaasPayments.attendanceId],
    references: [attendance.id],
  }),
  match: one(matches, {
    fields: [asaasPayments.matchId],
    references: [matches.id],
  }),
  player: one(users, {
    fields: [asaasPayments.playerId],
    references: [users.id],
  }),
}));

export const webhookLogsRelations = relations(webhookLogs, ({ one }) => ({
  group: one(groups, {
    fields: [webhookLogs.groupId],
    references: [groups.id],
  }),
}));
