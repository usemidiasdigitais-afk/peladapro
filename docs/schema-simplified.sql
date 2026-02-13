-- ============================================
-- PELADA PRÓ - SCHEMA SQL SIMPLIFICADO
-- ============================================
-- PostgreSQL 14+ (Supabase)
-- Sem soft deletes para evitar conflitos

-- ============================================
-- EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- CAMADA 1: AUTENTICAÇÃO E HIERARQUIA
-- ============================================

-- Tabela de Grupos
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  plan VARCHAR(50) NOT NULL DEFAULT 'FREE' CHECK (plan IN ('FREE', 'PREMIUM', 'ENTERPRISE')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_email ON groups(email);
CREATE INDEX idx_groups_plan ON groups(plan);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'MODERATOR', 'USER')),
  elo_rating INT NOT NULL DEFAULT 1200,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE UNIQUE INDEX idx_users_group_email ON users(group_id, email);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- CAMADA 2: CRIAÇÃO DE PELADAS
-- ============================================

-- Tabela de Partidas
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  sport VARCHAR(50) NOT NULL CHECK (sport IN ('FOOTBALL', 'FUTSAL', 'BASKETBALL', 'VOLLEYBALL')),
  location VARCHAR(500) NOT NULL,
  match_date TIMESTAMP NOT NULL,
  match_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_players INT NOT NULL DEFAULT 11 CHECK (max_players > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_group_id ON matches(group_id);
CREATE INDEX idx_matches_created_by ON matches(created_by);
CREATE INDEX idx_matches_sport ON matches(sport);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_date ON matches(match_date);

-- Tabela de Presença
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('CONFIRMED', 'PENDING', 'CANCELLED')),
  team_assignment INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, user_id)
);

CREATE INDEX idx_attendance_match_id ON attendance(match_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Tabela de Links de Convite
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invite_links_match_id ON invite_links(match_id);
CREATE INDEX idx_invite_links_token ON invite_links(token);
CREATE INDEX idx_invite_links_expires_at ON invite_links(expires_at);

-- ============================================
-- CAMADA 3: PAGAMENTOS ASAAS/PIX
-- ============================================

-- Tabela de Pagamentos Asaas
CREATE TABLE IF NOT EXISTS asaas_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asaas_id VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'RECEIVED', 'OVERDUE', 'REFUNDED')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('PIX', 'CREDIT_CARD', 'BANK_TRANSFER')),
  pix_key VARCHAR(255),
  pix_qr_code TEXT,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_asaas_payments_group_id ON asaas_payments(group_id);
CREATE INDEX idx_asaas_payments_match_id ON asaas_payments(match_id);
CREATE INDEX idx_asaas_payments_user_id ON asaas_payments(user_id);
CREATE INDEX idx_asaas_payments_status ON asaas_payments(status);
CREATE INDEX idx_asaas_payments_asaas_id ON asaas_payments(asaas_id);

-- Tabela de Logs de Webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_logs_group_id ON webhook_logs(group_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- ============================================
-- CAMADA 4: MÓDULO CHURRASCO
-- ============================================

-- Tabela de Despesas de Churrasco
CREATE TABLE IF NOT EXISTS barbecue_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('MEAT', 'DRINKS', 'EXTRAS', 'OTHER')),
  description VARCHAR(500) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_barbecue_expenses_group_id ON barbecue_expenses(group_id);
CREATE INDEX idx_barbecue_expenses_match_id ON barbecue_expenses(match_id);
CREATE INDEX idx_barbecue_expenses_created_by ON barbecue_expenses(created_by);
CREATE INDEX idx_barbecue_expenses_category ON barbecue_expenses(category);

-- Tabela de Débitos de Churrasco
CREATE TABLE IF NOT EXISTS barbecue_debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  debtor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creditor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, debtor_id, creditor_id)
);

CREATE INDEX idx_barbecue_debts_group_id ON barbecue_debts(group_id);
CREATE INDEX idx_barbecue_debts_match_id ON barbecue_debts(match_id);
CREATE INDEX idx_barbecue_debts_debtor_id ON barbecue_debts(debtor_id);
CREATE INDEX idx_barbecue_debts_creditor_id ON barbecue_debts(creditor_id);
CREATE INDEX idx_barbecue_debts_status ON barbecue_debts(status);

-- ============================================
-- COMENTÁRIOS
-- ============================================
COMMENT ON TABLE groups IS 'Grupos de usuários para multi-tenancy';
COMMENT ON TABLE users IS 'Usuários do sistema com ELO rating';
COMMENT ON TABLE sessions IS 'Sessões de autenticação';
COMMENT ON TABLE matches IS 'Peladas/partidas de esportes';
COMMENT ON TABLE attendance IS 'Presença de jogadores em peladas';
COMMENT ON TABLE invite_links IS 'Links de convite para peladas';
COMMENT ON TABLE asaas_payments IS 'Pagamentos via Asaas/PIX';
COMMENT ON TABLE webhook_logs IS 'Logs de webhooks recebidos';
COMMENT ON TABLE barbecue_expenses IS 'Despesas de churrasco';
COMMENT ON TABLE barbecue_debts IS 'Débitos de churrasco entre jogadores';

-- ============================================
-- FIM DO SCHEMA
-- ============================================
