-- ============================================
-- SCRIPT DE INICIALIZAÇÃO - USUÁRIO ADMIN
-- ============================================
-- Cria o grupo inicial e usuário ADMIN
-- Execute com: psql -d pelada_pro -f scripts/init-admin-user.sql

-- ============================================
-- PASSO 1: Criar Grupo
-- ============================================
INSERT INTO groups (name, email, plan)
VALUES (
  'Pelada Pró Master',
  'usemidiasdigitais@gmail.com',
  'PREMIUM'
)
ON CONFLICT (email) DO NOTHING;

-- Obter ID do grupo criado
WITH group_data AS (
  SELECT id FROM groups WHERE email = 'usemidiasdigitais@gmail.com' LIMIT 1
)

-- ============================================
-- PASSO 2: Criar Usuário ADMIN
-- ============================================
INSERT INTO users (
  group_id,
  email,
  name,
  password_hash,
  role,
  phone,
  is_active
)
SELECT
  g.id,
  'usemidiasdigitais@gmail.com',
  'Admin Master',
  -- Hash bcrypt da senha: 'Pelada@2026' (gere com: bcrypt('Pelada@2026'))
  -- Para produção, substitua com hash real
  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/GOe',
  'ADMIN',
  '11999999999',
  true
FROM group_data g;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
SELECT 
  'Grupo criado:' as info,
  g.id,
  g.name,
  g.email,
  g.plan
FROM groups g
WHERE g.email = 'usemidiasdigitais@gmail.com';

SELECT 
  'Usuário criado:' as info,
  u.id,
  u.email,
  u.name,
  u.role,
  u.group_id
FROM users u
WHERE u.email = 'usemidiasdigitais@gmail.com';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. A senha padrão é: Pelada@2026
-- 2. Altere a senha após o primeiro login
-- 3. O hash bcrypt acima é um exemplo
-- 4. Para gerar hash real, use:
--    - Node.js: bcrypt.hash('Pelada@2026', 10)
--    - Python: bcrypt.hashpw(b'Pelada@2026', bcrypt.gensalt())
--    - Online: https://bcrypt-generator.com/
