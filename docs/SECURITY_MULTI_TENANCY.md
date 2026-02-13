# Segurança e Multi-tenancy - Pelada Pró

## 🔐 Visão Geral

O Pelada Pró implementa **isolamento completo de dados** entre grupos usando multi-tenancy com `group_id`. Cada usuário só pode acessar dados do seu grupo.

## 🏗️ Arquitetura de Segurança

```
┌─────────────────────────────────────────────────────┐
│              Frontend (React Native)                 │
│  - JWT Token com group_id                           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│         Middleware de Autenticação                   │
│  - Validar JWT                                       │
│  - Extrair group_id                                  │
│  - Validar assinatura                                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│    Middleware de Multi-tenancy                       │
│  - Validar group_id                                  │
│  - Validar acesso a recurso                          │
│  - Sanitizar query/body                              │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      Validador de Query                              │
│  - Garantir WHERE group_id                           │
│  - Validar ownership de recurso                      │
│  - Logar tentativas de acesso                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│      Banco de Dados (PostgreSQL)                     │
│  - Todas as tabelas têm group_id                     │
│  - Índices em group_id para performance              │
│  - Foreign keys para integridade                     │
└─────────────────────────────────────────────────────┘
```

## 🔑 Princípios de Segurança

### 1. **Isolamento por Group ID**

Toda tabela tem coluna `group_id`:

```sql
CREATE TABLE matches (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL,
  sport TEXT NOT NULL,
  -- ...
  FOREIGN KEY (group_id) REFERENCES groups(id)
);
```

### 2. **WHERE group_id em Todas as Queries**

```typescript
// ✅ CORRETO
const matches = await db.query.matches.findMany({
  where: (matches, { eq, and }) =>
    and(
      eq(matches.groupId, userGroupId),
      eq(matches.sport, 'futebol')
    ),
});

// ❌ ERRADO - Sem filtro group_id
const matches = await db.query.matches.findMany({
  where: (matches, { eq }) => eq(matches.sport, 'futebol'),
});
```

### 3. **Validação de Ownership**

Antes de acessar um recurso, validar que pertence ao grupo:

```typescript
const match = await db.query.matches.findFirst({
  where: (matches, { eq }) => eq(matches.id, matchId),
});

if (!match || match.groupId !== userGroupId) {
  throw new Error('Acesso negado');
}
```

### 4. **Sanitização de Entrada**

Nunca confiar em `group_id` do usuário:

```typescript
// ❌ ERRADO - Usar group_id do body
const groupId = req.body.groupId;

// ✅ CORRETO - Usar group_id do JWT
const groupId = req.groupId; // Extraído do JWT
```

## 🛡️ Middleware de Multi-tenancy

### Aplicação

```typescript
import { multiTenancyMiddleware } from './middleware/multi-tenancy-middleware';

app.use(multiTenancyMiddleware);
```

### Funcionalidades

| Middleware | Função |
|-----------|--------|
| `multiTenancyMiddleware` | Validar group_id em requisição |
| `requireAdminRole` | Proteger rotas de admin |
| `requireSuperAdminRole` | Proteger rotas de super admin |
| `validateQueryParameters` | Validar query params |
| `validateBodyParameters` | Validar body params |
| `validatePathParameters` | Validar path params |
| `auditAccessAttempts` | Logar tentativas de acesso |
| `enforceGroupId` | Adicionar group_id automaticamente |

### Exemplo de Uso

```typescript
app.get('/matches/:matchId', 
  authMiddleware,
  multiTenancyMiddleware,
  validatePathParameters('matchId'),
  requireAdminRole,
  async (req, res) => {
    // req.groupId está validado
    // req.params.matchId está validado
    // Usuário tem role ADMIN ou SUPER_ADMIN
  }
);
```

## ✅ Validador de Query

### Validações Implementadas

```typescript
// 1. Validar que query tem filtro group_id
validateQueryHasGroupFilter(query, userGroupId);

// 2. Validar que dados têm group_id
validateDataHasGroupId(data, userGroupId);

// 3. Validar array de objetos
validateArrayHasGroupId(data, userGroupId);

// 4. Validar ownership de recurso
validateResourceBelongsToGroup(resourceId, resourceGroupId, userGroupId);

// 5. Validar UUID
validateUUID(id);

// 6. Sanitizar query
sanitizeQuery(query, userGroupId);

// 7. Sanitizar dados
sanitizeData(data, userGroupId);
```

### Exemplo

```typescript
const query = {
  where: {
    groupId: { equals: userGroupId },
    sport: 'futebol'
  }
};

const validation = validateQueryHasGroupFilter(query, userGroupId);

if (!validation.isValid) {
  console.error(validation.errors);
  throw new Error('Query inválida');
}
```

## 🧪 Testes de Segurança

### Executar Testes

```bash
npm test -- security-multi-tenancy.test.ts
```

### Cobertura

- ✅ Query validation (com/sem group_id)
- ✅ Data validation
- ✅ Array validation
- ✅ Resource ownership
- ✅ UUID validation
- ✅ Query sanitization
- ✅ Data sanitization
- ✅ Email validation
- ✅ Webhook validation
- ✅ SQL injection prevention
- ✅ Cross-group access prevention

## 🚨 Proteção contra Ataques

### 1. SQL Injection

```typescript
// ❌ VULNERÁVEL
const query = `SELECT * FROM matches WHERE id = '${matchId}'`;

// ✅ SEGURO - Usar ORM com prepared statements
const matches = await db.query.matches.findFirst({
  where: (matches, { eq }) => eq(matches.id, matchId),
});
```

### 2. URL Manipulation

```typescript
// ❌ VULNERÁVEL
const matchId = req.params.matchId; // Sem validação
const match = await getMatch(matchId);

// ✅ SEGURO - Validar ownership
const matchId = req.params.matchId;
const match = await db.query.matches.findFirst({
  where: (matches, { eq }) => eq(matches.id, matchId),
});

if (!match || match.groupId !== req.groupId) {
  throw new Error('Acesso negado');
}
```

### 3. Cross-group Access

```typescript
// ❌ VULNERÁVEL
const matches = await db.query.matches.findMany({
  where: (matches, { eq }) => eq(matches.sport, 'futebol'),
});

// ✅ SEGURO - Incluir group_id
const matches = await db.query.matches.findMany({
  where: (matches, { eq, and }) =>
    and(
      eq(matches.groupId, req.groupId),
      eq(matches.sport, 'futebol')
    ),
});
```

### 4. Privilege Escalation

```typescript
// ❌ VULNERÁVEL
const userRole = req.body.role; // Confiança no cliente

// ✅ SEGURO - Usar role do JWT
const userRole = req.userRole; // Extraído do JWT
```

### 5. Data Leakage

```typescript
// ❌ VULNERÁVEL
const allUsers = await db.query.users.findMany();

// ✅ SEGURO - Filtrar por group_id
const users = await db.query.users.findMany({
  where: (users, { eq }) => eq(users.groupId, req.groupId),
});
```

## 📋 Checklist de Segurança

Para cada novo endpoint, verificar:

- [ ] Autenticação JWT obrigatória
- [ ] Validação de group_id em middleware
- [ ] WHERE group_id em todas as queries
- [ ] Validação de ownership de recurso
- [ ] Sanitização de entrada (query, body, path)
- [ ] Validação de role/permissões
- [ ] Logging de tentativas de acesso
- [ ] Testes de segurança (cross-group access)
- [ ] Documentação de segurança

## 🔍 Auditoria

### Logs de Segurança

```
[SECURITY VIOLATION] Query sem filtro group_id
  userId: 550e8400-e29b-41d4-a716-446655440000
  groupId: 660e8400-e29b-41d4-a716-446655440001
  timestamp: 2024-02-12T10:30:00Z

[AUDIT] Acesso negado: GET /matches/match-123
  userId: 550e8400-e29b-41d4-a716-446655440000
  groupId: 660e8400-e29b-41d4-a716-446655440001
  statusCode: 403
  timestamp: 2024-02-12T10:30:00Z
```

### Consultar Logs

```sql
-- Tentativas de acesso negado
SELECT * FROM logs 
WHERE status_code IN (401, 403)
ORDER BY timestamp DESC
LIMIT 100;

-- Tentativas de SQL injection
SELECT * FROM logs 
WHERE message LIKE '%SQL%' OR message LIKE '%injection%'
ORDER BY timestamp DESC;

-- Acessos cruzados entre grupos
SELECT * FROM logs 
WHERE message LIKE '%cross-group%'
ORDER BY timestamp DESC;
```

## 🔐 Variáveis de Ambiente

```bash
# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# Segurança
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000
WEBHOOK_SECRET=your-webhook-secret

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

## 📊 Exemplo de Fluxo Seguro

### 1. Login

```typescript
// Usuário faz login
POST /auth/login
{
  "email": "admin@group1.com",
  "password": "password"
}

// Retorna JWT com group_id
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "groupId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Requisição Autenticada

```typescript
// Cliente envia requisição com JWT
GET /matches/match-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// Middleware extrai group_id do JWT
req.groupId = "550e8400-e29b-41d4-a716-446655440000"
req.userId = "user-uuid"
```

### 3. Validação de Acesso

```typescript
// Backend valida ownership
const match = await db.query.matches.findFirst({
  where: (matches, { eq, and }) =>
    and(
      eq(matches.id, 'match-123'),
      eq(matches.groupId, req.groupId) // ✅ Filtro group_id
    ),
});

if (!match) {
  return res.status(403).json({ error: 'Acesso negado' });
}
```

### 4. Resposta Segura

```typescript
// Retorna apenas dados do grupo
{
  "id": "match-123",
  "groupId": "550e8400-e29b-41d4-a716-446655440000",
  "sport": "futebol",
  "date": "2024-02-15",
  "location": "Parque Central"
}
```

## 🚀 Deployment

### Verificação de Segurança

```bash
# 1. Verificar que todas as tabelas têm group_id
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name NOT IN ('pg_*', 'information_schema.*');

# 2. Verificar índices em group_id
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('matches', 'players', 'groups', 'transactions')
AND indexdef LIKE '%group_id%';

# 3. Verificar foreign keys
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_name = 'matches' 
AND constraint_type = 'FOREIGN KEY';
```

### Testes Pré-deployment

```bash
# 1. Executar testes de segurança
npm test -- security-multi-tenancy.test.ts

# 2. Verificar cobertura
npm test -- --coverage security-multi-tenancy.test.ts

# 3. Executar penetration tests
npm run test:security

# 4. Verificar logs de segurança
tail -f logs/security.log
```

## 📚 Referências

- [OWASP Multi-tenancy](https://owasp.org/www-community/attacks/Multi-tenancy)
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)

## 🔄 Fluxo de Resposta a Incidente

1. **Detectar** - Logs de segurança alertam sobre anomalia
2. **Investigar** - Consultar logs de auditoria
3. **Isolar** - Desativar conta suspeita
4. **Remediar** - Reverter mudanças não autorizadas
5. **Comunicar** - Notificar usuários afetados
6. **Melhorar** - Atualizar regras de segurança

## 📝 Notas

- Sempre usar HTTPS em produção
- Manter JWT_SECRET em segredo (usar variáveis de ambiente)
- Rotacionar secrets regularmente
- Fazer backup de dados regularmente
- Monitorar logs de segurança 24/7
- Fazer auditorias de segurança mensalmente
- Manter dependências atualizadas
- Usar rate limiting em todos os endpoints
