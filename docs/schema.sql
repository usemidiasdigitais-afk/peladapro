-- ============================================
-- PELADA PRÓ - SCHEMA SQL FINAL
-- ============================================
-- PostgreSQL 14+
-- Inclui: Autenticação, Peladas, Pagamentos, Churrasco
-- Com Row-Level Security (RLS) para multi-tenancy

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
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Índices para groups
CREATE INDEX idx_groups_email ON groups(email);
CREATE INDEX idx_groups_plan ON groups(plan);
CREATE INDEX idx_groups_deleted_at ON groups(deleted_at);

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('ADMIN', 'MODERATOR', 'PLAYER')),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  UNIQUE(group_id, email)
);

-- Índices para users
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Tabela de Sessões
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255) UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_group_id ON sessions(group_id);
CREATE INDEX idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- ============================================
-- CAMADA 2: PELADAS E PRESENÇA
-- ============================================

-- Tabela de Peladas
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  sport VARCHAR(50) NOT NULL DEFAULT 'FOOTBALL' CHECK (sport IN ('FOOTBALL', 'VOLLEYBALL', 'BASKETBALL', 'TENNIS', 'BADMINTON')),
  date TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  match_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  barbecue_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  max_players INTEGER NOT NULL DEFAULT 11,
  confirmed_players INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ONGOING', 'FINISHED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Índices para matches
CREATE INDEX idx_matches_group_id ON matches(group_id);
CREATE INDEX idx_matches_created_by ON matches(created_by);
CREATE INDEX idx_matches_date ON matches(date);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_deleted_at ON matches(deleted_at);

-- Tabela de Presença
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED', 'ABSENT')),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(match_id, player_id)
);

-- Índices para attendance
CREATE INDEX idx_attendance_match_id ON attendance(match_id);
CREATE INDEX idx_attendance_player_id ON attendance(player_id);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Tabela de Links de Convite
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  code VARCHAR(32) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para invite_links
CREATE INDEX idx_invite_links_match_id ON invite_links(match_id);
CREATE INDEX idx_invite_links_code ON invite_links(code);
CREATE INDEX idx_invite_links_expires_at ON invite_links(expires_at);

-- ============================================
-- CAMADA 3: PAGAMENTOS ASAAS
-- ============================================

-- Tabela de Pagamentos Asaas
CREATE TABLE IF NOT EXISTS asaas_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  asaas_charge_id VARCHAR(255) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED')),
  pix_qr_code TEXT,
  pix_copy_paste VARCHAR(255),
  expires_at TIMESTAMP,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para asaas_payments
CREATE INDEX idx_asaas_payments_group_id ON asaas_payments(group_id);
CREATE INDEX idx_asaas_payments_match_id ON asaas_payments(match_id);
CREATE INDEX idx_asaas_payments_asaas_charge_id ON asaas_payments(asaas_charge_id);
CREATE INDEX idx_asaas_payments_status ON asaas_payments(status);
CREATE INDEX idx_asaas_payments_paid_at ON asaas_payments(paid_at);

-- Tabela de Logs de Webhook
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para webhook_logs
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
  paid_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('MEAT', 'DRINKS', 'SIDES', 'DESSERT', 'OTHER')),
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  split_between INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para barbecue_expenses
CREATE INDEX idx_barbecue_expenses_group_id ON barbecue_expenses(group_id);
CREATE INDEX idx_barbecue_expenses_match_id ON barbecue_expenses(match_id);
CREATE INDEX idx_barbecue_expenses_paid_by ON barbecue_expenses(paid_by);
CREATE INDEX idx_barbecue_expenses_category ON barbecue_expenses(category);

-- Tabela de Débitos de Churrasco
CREATE TABLE IF NOT EXISTS barbecue_debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  debtor UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creditor UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Índices para barbecue_debts
CREATE INDEX idx_barbecue_debts_group_id ON barbecue_debts(group_id);
CREATE INDEX idx_barbecue_debts_match_id ON barbecue_debts(match_id);
CREATE INDEX idx_barbecue_debts_debtor ON barbecue_debts(debtor);
CREATE INDEX idx_barbecue_debts_creditor ON barbecue_debts(creditor);
CREATE INDEX idx_barbecue_debts_is_paid ON barbecue_debts(is_paid);

-- ============================================
-- ROW-LEVEL SECURITY (RLS) - MULTI-TENANCY
-- ============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE asaas_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbecue_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbecue_debts ENABLE ROW LEVEL SECURITY;

-- RLS Policies para groups
CREATE POLICY "groups_select_own" ON groups
  FOR SELECT USING (id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "groups_update_own" ON groups
  FOR UPDATE USING (id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para users
CREATE POLICY "users_select_own_group" ON users
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "users_insert_own_group" ON users
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "users_update_own_group" ON users
  FOR UPDATE USING (group_id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para sessions
CREATE POLICY "sessions_select_own_group" ON sessions
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "sessions_insert_own_group" ON sessions
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "sessions_delete_own_group" ON sessions
  FOR DELETE USING (group_id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para matches
CREATE POLICY "matches_select_own_group" ON matches
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "matches_insert_own_group" ON matches
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "matches_update_own_group" ON matches
  FOR UPDATE USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "matches_delete_own_group" ON matches
  FOR DELETE USING (group_id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para attendance
CREATE POLICY "attendance_select_own_group" ON attendance
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches 
      WHERE group_id = current_setting('app.current_group_id')::uuid
    )
  );

CREATE POLICY "attendance_insert_own_group" ON attendance
  FOR INSERT WITH CHECK (
    match_id IN (
      SELECT id FROM matches 
      WHERE group_id = current_setting('app.current_group_id')::uuid
    )
  );

CREATE POLICY "attendance_update_own_group" ON attendance
  FOR UPDATE USING (
    match_id IN (
      SELECT id FROM matches 
      WHERE group_id = current_setting('app.current_group_id')::uuid
    )
  );

-- RLS Policies para invite_links
CREATE POLICY "invite_links_select_own_group" ON invite_links
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM matches 
      WHERE group_id = current_setting('app.current_group_id')::uuid
    )
  );

CREATE POLICY "invite_links_insert_own_group" ON invite_links
  FOR INSERT WITH CHECK (
    match_id IN (
      SELECT id FROM matches 
      WHERE group_id = current_setting('app.current_group_id')::uuid
    )
  );

-- RLS Policies para asaas_payments
CREATE POLICY "asaas_payments_select_own_group" ON asaas_payments
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "asaas_payments_insert_own_group" ON asaas_payments
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "asaas_payments_update_own_group" ON asaas_payments
  FOR UPDATE USING (group_id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para webhook_logs
CREATE POLICY "webhook_logs_select_own_group" ON webhook_logs
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "webhook_logs_insert_own_group" ON webhook_logs
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para barbecue_expenses
CREATE POLICY "barbecue_expenses_select_own_group" ON barbecue_expenses
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "barbecue_expenses_insert_own_group" ON barbecue_expenses
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "barbecue_expenses_update_own_group" ON barbecue_expenses
  FOR UPDATE USING (group_id = current_setting('app.current_group_id')::uuid);

-- RLS Policies para barbecue_debts
CREATE POLICY "barbecue_debts_select_own_group" ON barbecue_debts
  FOR SELECT USING (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "barbecue_debts_insert_own_group" ON barbecue_debts
  FOR INSERT WITH CHECK (group_id = current_setting('app.current_group_id')::uuid);

CREATE POLICY "barbecue_debts_update_own_group" ON barbecue_debts
  FOR UPDATE USING (group_id = current_setting('app.current_group_id')::uuid);

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View: Resumo de Peladas por Grupo
CREATE OR REPLACE VIEW match_summary AS
SELECT 
  m.id,
  m.group_id,
  m.sport,
  m.date,
  m.location,
  m.match_cost,
  m.barbecue_cost,
  m.max_players,
  m.confirmed_players,
  m.status,
  COUNT(DISTINCT a.id) as attendance_count,
  COALESCE(SUM(be.amount), 0) as total_barbecue_cost,
  (m.match_cost + COALESCE(SUM(be.amount), 0)) as total_cost
FROM matches m
LEFT JOIN attendance a ON m.id = a.match_id AND a.status = 'CONFIRMED'
LEFT JOIN barbecue_expenses be ON m.id = be.match_id
GROUP BY m.id, m.group_id, m.sport, m.date, m.location, m.match_cost, m.barbecue_cost, m.max_players, m.confirmed_players, m.status;

-- View: Débitos Pendentes por Grupo
CREATE OR REPLACE VIEW pending_debts AS
SELECT 
  bd.id,
  bd.group_id,
  bd.match_id,
  bd.debtor,
  bd.creditor,
  bd.amount,
  u_debtor.name as debtor_name,
  u_creditor.name as creditor_name,
  bd.created_at
FROM barbecue_debts bd
JOIN users u_debtor ON bd.debtor = u_debtor.id
JOIN users u_creditor ON bd.creditor = u_creditor.id
WHERE bd.is_paid = false;

-- View: Pagamentos Pendentes por Grupo
CREATE OR REPLACE VIEW pending_payments AS
SELECT 
  ap.id,
  ap.group_id,
  ap.match_id,
  ap.amount,
  ap.status,
  ap.expires_at,
  m.date as match_date,
  m.location
FROM asaas_payments ap
JOIN matches m ON ap.match_id = m.id
WHERE ap.status IN ('PENDING', 'EXPIRED');

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função: Atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER trigger_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_matches_updated_at BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_invite_links_updated_at BEFORE UPDATE ON invite_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_asaas_payments_updated_at BEFORE UPDATE ON asaas_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_barbecue_expenses_updated_at BEFORE UPDATE ON barbecue_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_barbecue_debts_updated_at BEFORE UPDATE ON barbecue_debts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PERMISSÕES
-- ============================================

-- Criar role de aplicação
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_password_change_me';

-- Permissões para app_user
GRANT CONNECT ON DATABASE pelada_pro TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;

-- Permissões de SELECT, INSERT, UPDATE, DELETE
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Permissões de acesso a views
GRANT SELECT ON match_summary TO app_user;
GRANT SELECT ON pending_debts TO app_user;
GRANT SELECT ON pending_payments TO app_user;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE groups IS 'Grupos de usuários (multi-tenancy)';
COMMENT ON TABLE users IS 'Usuários do sistema';
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
