# Segurança e Multi-tenancy - Pelada Pró

Documentação completa do sistema de segurança com autenticação multi-role e isolamento de dados por grupo.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Segurança](#arquitetura-de-segurança)
3. [Multi-tenancy](#multi-tenancy)
4. [Autenticação](#autenticação)
5. [Autorização](#autorização)
6. [Proteção contra Ataques](#proteção-contra-ataques)
7. [Boas Práticas](#boas-práticas)

## 🎯 Visão Geral

O Pelada Pró implementa um sistema de segurança robusto com:

- ✅ **Autenticação JWT** - Login seguro com tokens
- ✅ **Multi-role** - Super Admin, Admin, Player
- ✅ **Multi-tenancy** - Isolamento de dados por grupo
- ✅ **RBAC** - Role-Based Access Control
- ✅ **Proteção contra ataques** - SQL Injection, XSS, CSRF, etc

## 🏗️ Arquitetura de Segurança

### Camadas de Segurança

```
┌─────────────────────────────────┐
│   Aplicação Mobile (Expo)       │
├─────────────────────────────────┤
│   SecureAuthContext             │ ← Gerencia autenticação
├─────────────────────────────────┤
│   SecureAPIClient               │ ← Valida requisições
├─────────────────────────────────┤
│   HTTP com JWT Token            │ ← Comunicação segura
├─────────────────────────────────┤
│   Backend API                   │ ← Valida group_id
├─────────────────────────────────┤
│   Database com Row-Level Security│ ← Isolamento de dados
└─────────────────────────────────┘
```

## 🔐 Multi-tenancy

### Conceito

Cada usuário pertence a um **grupo (tenant)**. Dados são isolados por grupo:

```
Usuário 1 (group-1)
├── Partidas
├── Jogadores
├── Pagamentos
└── Churrasco

Usuário 2 (group-2)
├── Partidas
├── Jogadores
├── Pagamentos
└── Churrasco
```

### Implementação

**1. Campo group_id em cada entidade:**

```typescript
interface Match {
  id: string;
  groupId: string; // ← Isolamento
  name: string;
  date: string;
  // ...
}
```

**2. Validação em cada query:**

```typescript
// ❌ INSEGURO
const matches = await db.query.matches.findMany();

// ✅ SEGURO
const matches = await db.query.matches.findMany({
  where: (matches, { eq }) => eq(matches.groupId, userGroupId),
});
```

**3. Validação no cliente:**

```typescript
// SecureAPIClient valida group_id antes de enviar
await apiClient.get('/api/matches', { groupId: 'group-1' });
```

### Proteção contra Cross-group Access

```typescript
// Usuário de group-1 tenta acessar group-2
const user = { groupId: 'group-1', role: 'PLAYER' };
const requestedGroupId = 'group-2';

// ❌ Acesso negado
if (user.role !== 'SUPER_ADMIN' && user.groupId !== requestedGroupId) {
  throw new Error('Acesso negado: você não tem permissão para acessar este grupo');
}

// ✅ Super admin pode acessar qualquer grupo
if (user.role === 'SUPER_ADMIN') {
  // Permitir acesso
}
```

## 🔑 Autenticação

### Fluxo de Login

```
1. Usuário insere email e senha
   ↓
2. Backend valida credenciais
   ↓
3. Backend gera JWT token
   ↓
4. App salva token em AsyncStorage
   ↓
5. Token é incluído em todas as requisições
   ↓
6. Backend valida token em cada requisição
```

### Estrutura do JWT Token

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user-1",
    "email": "user@example.com",
    "role": "PLAYER",
    "groupId": "group-1",
    "iat": 1707724800,
    "exp": 1707811200
  },
  "signature": "..."
}
```

### Uso no Cliente

```typescript
import { useSecureAuth } from '@/contexts/SecureAuthContext';

export default function LoginScreen() {
  const { login, isLoading } = useSecureAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
      // Usuário autenticado
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  return (
    // UI
  );
}
```

## 🛡️ Autorização

### Role-Based Access Control (RBAC)

**Hierarquia de Roles:**

```
SUPER_ADMIN (3)
    ↓
ADMIN (2)
    ↓
PLAYER (1)
```

**Permissões por Role:**

| Ação | SUPER_ADMIN | ADMIN | PLAYER |
|------|-------------|-------|--------|
| Criar grupo | ✅ | ❌ | ❌ |
| Gerenciar grupo | ✅ | ✅ | ❌ |
| Criar partida | ✅ | ✅ | ✅ |
| Editar partida | ✅ | ✅ | ✅ |
| Deletar partida | ✅ | ✅ | ❌ |
| Ver pagamentos | ✅ | ✅ | ✅ |
| Editar pagamentos | ✅ | ✅ | ❌ |
| Acessar outro grupo | ✅ | ❌ | ❌ |

### Validação de Permissão

```typescript
import { usePermission } from '@/contexts/SecureAuthContext';

export default function AdminPanel() {
  const isAdmin = usePermission('ADMIN');

  if (!isAdmin) {
    return <Text>Acesso negado</Text>;
  }

  return (
    // Admin panel
  );
}
```

## 🛡️ Proteção contra Ataques

### 1. SQL Injection

**Proteção:**
- ✅ ORM (Drizzle) com prepared statements
- ✅ Validação de entrada
- ✅ Parametrização de queries

```typescript
// ❌ Vulnerável
const matches = await db.query(`SELECT * FROM matches WHERE id = '${id}'`);

// ✅ Seguro
const matches = await db.query.matches.findFirst({
  where: (matches, { eq }) => eq(matches.id, id),
});
```

### 2. XSS (Cross-Site Scripting)

**Proteção:**
- ✅ Sanitização de entrada
- ✅ Escape de output
- ✅ Content Security Policy

```typescript
// ❌ Vulnerável
<Text>{userInput}</Text>

// ✅ Seguro
<Text>{sanitize(userInput)}</Text>
```

### 3. CSRF (Cross-Site Request Forgery)

**Proteção:**
- ✅ CSRF tokens
- ✅ SameSite cookies
- ✅ Origin validation

### 4. Brute Force

**Proteção:**
- ✅ Rate limiting
- ✅ Exponential backoff
- ✅ Account lockout

```typescript
// Máximo 5 tentativas a cada 15 minutos
const limiter = new RateLimiter(5, 900000);

if (!limiter.isAllowed(userId)) {
  return res.status(429).json({ error: 'Too many attempts' });
}
```

### 5. Privilege Escalation

**Proteção:**
- ✅ Usar role do JWT, não do body
- ✅ Validar role em cada operação
- ✅ Auditoria de ações

```typescript
// ❌ Vulnerável
const userRole = req.body.role;

// ✅ Seguro
const userRole = req.user.role; // Do JWT
```

### 6. Data Leakage

**Proteção:**
- ✅ Validação de group_id em cada query
- ✅ Row-level security no banco
- ✅ Auditoria de acessos

## 📋 Boas Práticas

### 1. Sempre Validar group_id

```typescript
// ❌ Errado
const matches = await db.query.matches.findMany();

// ✅ Correto
const userGroupId = user.groupId;
const matches = await db.query.matches.findMany({
  where: (matches, { eq }) => eq(matches.groupId, userGroupId),
});
```

### 2. Usar Role do JWT

```typescript
// ❌ Errado
if (req.body.role === 'ADMIN') {
  // Fazer algo
}

// ✅ Correto
if (req.user.role === 'ADMIN') {
  // Fazer algo
}
```

### 3. Validar Ownership de Recurso

```typescript
// ❌ Errado
const match = await db.query.matches.findFirst({
  where: (matches, { eq }) => eq(matches.id, matchId),
});

// ✅ Correto
const match = await db.query.matches.findFirst({
  where: (matches, { and, eq }) =>
    and(
      eq(matches.id, matchId),
      eq(matches.groupId, userGroupId)
    ),
});
```

### 4. Logar Operações Sensíveis

```typescript
// Logar criação de partida
logger.info('Match created', {
  matchId: match.id,
  groupId: match.groupId,
  userId: user.id,
  timestamp: new Date().toISOString(),
});
```

### 5. Usar HTTPS em Produção

```typescript
// .env
API_URL=https://api.peladapro.com
```

### 6. Renovar Token Regularmente

```typescript
// Token expira em 24 horas
const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
```

## 🧪 Testes de Segurança

### Executar Testes

```bash
npm test -- security-multi-tenancy.test.ts
npm test -- security-multi-tenancy.test.ts --coverage
```

### Cenários Testados

- ✅ Autenticação (com/sem token)
- ✅ Multi-tenancy (acesso ao próprio grupo)
- ✅ Cross-group access (acesso a grupo diferente)
- ✅ RBAC (role insuficiente)
- ✅ Data isolation (dados isolados por grupo)
- ✅ Token management (token expirado)

## 📊 Checklist de Segurança

- [ ] Todos os endpoints validam group_id
- [ ] Todos os endpoints validam role
- [ ] Nenhuma query sem WHERE group_id
- [ ] Nenhuma operação sensível sem logging
- [ ] Tokens expiram após 24 horas
- [ ] HTTPS em produção
- [ ] Rate limiting configurado
- [ ] Testes de segurança passando
- [ ] Auditoria de acessos implementada
- [ ] Backup e disaster recovery

## 🚀 Deployment Seguro

### Pré-deployment

```bash
# Rodar testes de segurança
npm test -- security-multi-tenancy.test.ts

# Verificar vulnerabilidades
npm audit

# Verificar secrets em código
git secrets --scan
```

### Em Produção

```bash
# Usar HTTPS
API_URL=https://api.peladapro.com

# Configurar CORS
CORS_ORIGIN=https://peladapro.com

# Habilitar HSTS
Strict-Transport-Security: max-age=31536000

# Configurar CSP
Content-Security-Policy: default-src 'self'
```

## 📞 Suporte

Para questões de segurança:
- Email: security@peladapro.com
- Não publicar vulnerabilidades em issues públicas

---

**Desenvolvido com foco em segurança e isolamento de dados** 🔐
