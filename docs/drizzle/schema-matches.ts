import { pgTable, text, uuid, timestamp, varchar, integer, decimal, boolean, enum as pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users, groups } from './schema-auth';

// Enum para status de partida
export const matchStatusEnum = pgEnum('match_status', ['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']);

// Enum para status de presença
export const attendanceStatusEnum = pgEnum('attendance_status', ['PENDING', 'CONFIRMED', 'CANCELLED', 'NO_SHOW']);

// Tabela de partidas
export const matches = pgTable(
  'matches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
    createdBy: uuid('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    location: varchar('location', { length: 255 }).notNull(),
    latitude: decimal('latitude', { precision: 10, scale: 8 }),
    longitude: decimal('longitude', { precision: 11, scale: 8 }),
    scheduledDate: timestamp('scheduled_date').notNull(),
    maxPlayers: integer('max_players').notNull(),
    maxGoalkeepers: integer('max_goalkeepers').notNull().default(2),
    pricePerPlayer: decimal('price_per_player', { precision: 10, scale: 2 }).default('0'),
    barbecuePrice: decimal('barbecue_price', { precision: 10, scale: 2 }).default('0'),
    totalPrice: decimal('total_price', { precision: 10, scale: 2 }).default('0'),
    paymentRequired: boolean('payment_required').default(false),
    status: matchStatusEnum('status').default('SCHEDULED'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    groupIdIdx: index('idx_matches_group_id').on(table.groupId),
    createdByIdx: index('idx_matches_created_by').on(table.createdBy),
    statusIdx: index('idx_matches_status').on(table.status),
    scheduledDateIdx: index('idx_matches_scheduled_date').on(table.scheduledDate),
  })
);

// Tabela de presença
export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').default('PENDING'),
    position: varchar('position', { length: 50 }), // 'FIELD' ou 'GOALKEEPER'
    paymentStatus: varchar('payment_status', { length: 50 }).default('PENDING'), // 'PENDING', 'CONFIRMED', 'FAILED'
    asaasChargeId: varchar('asaas_charge_id', { length: 255 }),
    confirmedAt: timestamp('confirmed_at'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    matchIdIdx: index('idx_attendance_match_id').on(table.matchId),
    playerIdIdx: index('idx_attendance_player_id').on(table.playerId),
    statusIdx: index('idx_attendance_status').on(table.status),
    paymentStatusIdx: index('idx_attendance_payment_status').on(table.paymentStatus),
  })
);

// Tabela de links de convite
export const inviteLinks = pgTable(
  'invite_links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at'),
    usedCount: integer('used_count').default(0),
    maxUses: integer('max_uses'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    matchIdIdx: index('idx_invite_links_match_id').on(table.matchId),
    tokenIdx: index('idx_invite_links_token').on(table.token),
  })
);

// Relações
export const matchesRelations = relations(matches, ({ many, one }) => ({
  group: one(groups, {
    fields: [matches.groupId],
    references: [groups.id],
  }),
  creator: one(users, {
    fields: [matches.createdBy],
    references: [users.id],
  }),
  attendance: many(attendance),
  inviteLinks: many(inviteLinks),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  match: one(matches, {
    fields: [attendance.matchId],
    references: [matches.id],
  }),
  player: one(users, {
    fields: [attendance.playerId],
    references: [users.id],
  }),
}));

export const inviteLinksRelations = relations(inviteLinks, ({ one }) => ({
  match: one(matches, {
    fields: [inviteLinks.matchId],
    references: [matches.id],
  }),
}));
