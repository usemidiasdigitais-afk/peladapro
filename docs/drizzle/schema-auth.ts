import { pgTable, text, uuid, timestamp, varchar, enum as pgEnum, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum para roles
export const roleEnum = pgEnum('role', ['SUPER_ADMIN', 'ADMIN', 'PLAYER']);

// Tabela de grupos
export const groups = pgTable(
  'groups',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    adminId: uuid('admin_id'),
    asaasApiKey: varchar('asaas_api_key', { length: 255 }),
    asaasEnvironment: pgEnum('asaas_environment', ['sandbox', 'production']).default('sandbox'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    adminIdIdx: index('idx_groups_admin_id').on(table.adminId),
  })
);

// Tabela de usuários
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: roleEnum('role').notNull(),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    groupIdIdx: index('idx_users_group_id').on(table.groupId),
    roleIdx: index('idx_users_role').on(table.role),
  })
);

// Tabela de sessões
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    token: varchar('token', { length: 500 }).notNull().unique(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_sessions_user_id').on(table.userId),
    tokenIdx: index('idx_sessions_token').on(table.token),
  })
);

// Tabela de auditoria
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    groupId: uuid('group_id').references(() => groups.id, { onDelete: 'set null' }),
    action: varchar('action', { length: 255 }).notNull(),
    resource: varchar('resource', { length: 255 }),
    resourceId: varchar('resource_id', { length: 255 }),
    details: text('details'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_audit_logs_user_id').on(table.userId),
    groupIdIdx: index('idx_audit_logs_group_id').on(table.groupId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
  })
);

// Relações
export const groupsRelations = relations(groups, ({ many, one }) => ({
  users: many(users),
  admin: one(users, {
    fields: [groups.adminId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  group: one(groups, {
    fields: [users.groupId],
    references: [groups.id],
  }),
  sessions: many(sessions),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  group: one(groups, {
    fields: [auditLogs.groupId],
    references: [groups.id],
  }),
}));
