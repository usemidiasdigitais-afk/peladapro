-- ============================================
-- PELADA PRÓ - INSERIR DADOS DE TESTE
-- ============================================

-- 1. Inserir Grupo
INSERT INTO groups (id, name, email, plan)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Pelada Pró Master',
  'usemidiasdigitais@gmail.com',
  'PREMIUM'
);

-- 2. Inserir Usuário Admin
INSERT INTO users (id, group_id, email, name, password_hash, role, elo_rating)
VALUES (
  'a47ac10b-58cc-4372-a567-0e02b2c3d479',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'usemidiasdigitais@gmail.com',
  'Admin Master',
  '$2b$10$YourHashedPasswordHere',
  'ADMIN',
  1500
);

-- 3. Inserir Jogadores de Teste
INSERT INTO users (group_id, email, name, password_hash, role, elo_rating)
VALUES 
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador1@test.com', 'João Silva', '$2b$10$hash1', 'USER', 1200),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador2@test.com', 'Pedro Santos', '$2b$10$hash2', 'USER', 1150),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador3@test.com', 'Carlos Oliveira', '$2b$10$hash3', 'USER', 1300),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador4@test.com', 'Lucas Costa', '$2b$10$hash4', 'USER', 1100),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador5@test.com', 'Felipe Martins', '$2b$10$hash5', 'USER', 1250),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador6@test.com', 'André Gomes', '$2b$10$hash6', 'USER', 1180),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador7@test.com', 'Bruno Ferreira', '$2b$10$hash7', 'USER', 1220),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador8@test.com', 'Gustavo Rocha', '$2b$10$hash8', 'USER', 1280),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador9@test.com', 'Rodrigo Alves', '$2b$10$hash9', 'USER', 1160),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'jogador10@test.com', 'Thiago Mendes', '$2b$10$hash10', 'USER', 1210);

-- 4. Inserir Partida "Gunha Sports"
INSERT INTO matches (group_id, created_by, sport, location, match_date, match_cost, max_players, status, notes)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'a47ac10b-58cc-4372-a567-0e02b2c3d479',
  'FOOTBALL',
  'Gunha Sports',
  '2026-02-15 14:00:00',
  50.00,
  11,
  'SCHEDULED',
  'Partida de teste criada via dashboard'
);

-- 5. Verificar dados inseridos
SELECT 'Grupos' as tipo, COUNT(*) as total FROM groups
UNION ALL
SELECT 'Usuários', COUNT(*) FROM users
UNION ALL
SELECT 'Partidas', COUNT(*) FROM matches;
