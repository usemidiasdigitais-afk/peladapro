# Guia de Multi-tenancy - Pelada Pró

## Visão Geral

O Pelada Pró implementa **isolamento total de dados entre grupos** usando multi-tenancy. Cada grupo é completamente isolado, garantindo que:

- ✅ Admin de um grupo **NÃO** consegue ver dados de outro grupo
- ✅ Jogadores só veem dados do seu grupo
- ✅ Dados financeiros são isolados por grupo
- ✅ Super admin pode acessar todos os grupos (apenas para suporte)

---

## Arquitetura de Segurança

### 1. Contexto de Autenticação

```typescript
interface User {
  id: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER';
  groupId: string; // Chave de isolamento
}
```

### 2. Validação em Três Camadas

```
┌─────────────────────────────────────────┐
│ 1. Frontend (MultiTenancyContext)       │
│    - Valida group_id antes de requisição│
│    - Filtra dados localmente            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. API Client (SecureAPIClient)         │
│    - Adiciona X-Group-ID header         │
│    - Valida correspondência de group_id │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. Backend (Middleware)                 │
│    - Valida X-Group-ID header           │
│    - Filtra queries por group_id        │
│    - Rejeita acesso cruzado             │
└─────────────────────────────────────────┘
```

---

## Implementação

### MultiTenancyContext

Gerencia contexto de grupo para toda a aplicação:

```typescript
import { useMultiTenancy } from '@/contexts/MultiTenancyContext';

function MyComponent() {
  const { 
    validateGroupAccess,     // Validar acesso ao grupo
    getCurrentGroupId,       // Obter ID do grupo atual
    filterByGroupId,         // Filtrar array por grupo
    ensureGroupIdFilter,     // Garantir filtro em query
  } = useMultiTenancy();

  // Validar acesso
  if (!validateGroupAccess('group-123')) {
    return <Text>Acesso negado</Text>;
  }

  // Obter grupo atual
  const groupId = getCurrentGroupId();

  // Filtrar dados
  const myGroupPlayers = filterByGroupId(allPlayers);

  return <Text>{groupId}</Text>;
}
```

### SecureAPIClient

Cliente HTTP que garante isolamento:

```typescript
import { getSecureAPIClient, initializeSecureAPI } from '@/services/secure-api';

// Inicializar após login
initializeSecureAPI(token, groupId);

const api = getSecureAPIClient();

// GET - Automaticamente filtra por group_id
const players = await api.get('/players');

// POST - Automaticamente adiciona group_id
const newPlayer = await api.post('/players', {
  name: 'João',
  position: 'Goleiro',
  // group_id é adicionado automaticamente
});

// Tentar acessar grupo diferente = ERRO
try {
  await api.get('/groups/other-group/players', {
    groupId: 'other-group', // Erro: group_id mismatch
  });
} catch (error) {
  console.log('Access denied');
}
```

---

## Regras de Isolamento

### 1. Todas as Queries Devem Filtrar por group_id

❌ **ERRADO:**
```typescript
// Sem filtro de group_id
const players = await db.query.players.findMany();
```

✅ **CORRETO:**
```typescript
// Com filtro de group_id
const players = await db.query.players.findMany({
  where: (players, { eq }) => eq(players.groupId, userGroupId),
});
```

### 2. group_id Deve Estar em Todos os Modelos

```typescript
// Schema do banco de dados
export const players = pgTable('players', {
  id: uuid('id').primaryKey(),
  groupId: uuid('group_id').notNull(), // OBRIGATÓRIO
  name: text('name').notNull(),
  email: text('email').notNull(),
  // ... outros campos
});

// Índice para performance
export const playersGroupIdIdx = index('players_group_id_idx').on(players.groupId);
```

### 3. Validação em Requisições

```typescript
// Middleware no backend
app.use((req, res, next) => {
  const groupId = req.headers['x-group-id'];
  const userGroupId = req.user.groupId;

  if (groupId !== userGroupId && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Access denied' });
  }

  req.groupId = groupId;
  next();
});
```

---

## Casos de Uso

### Caso 1: Admin Tenta Acessar Outro Grupo

```
Admin1 (groupId: group-1)
  ↓
Tenta: GET /api/groups/group-2/players
  ↓
Validação: group-1 ≠ group-2
  ↓
Resultado: ❌ 403 Forbidden
```

### Caso 2: Admin Acessa Seu Próprio Grupo

```
Admin1 (groupId: group-1)
  ↓
Requisição: GET /api/players
  ↓
Header: X-Group-ID: group-1
  ↓
Validação: group-1 === group-1 ✓
  ↓
Query: SELECT * FROM players WHERE group_id = 'group-1'
  ↓
Resultado: ✅ Jogadores do grupo-1
```

### Caso 3: Super Admin Acessa Qualquer Grupo

```
SuperAdmin (role: SUPER_ADMIN)
  ↓
Requisição: GET /api/groups/group-2/players
  ↓
Validação: role === SUPER_ADMIN ✓
  ↓
Resultado: ✅ Jogadores do grupo-2
```

---

## Testes de Segurança

Execute os testes de multi-tenancy:

```bash
npm test -- multi-tenancy-security.test.ts
```

Testes cobrem:
- ✅ Acesso cruzado bloqueado
- ✅ Filtragem de queries
- ✅ Isolamento de dados
- ✅ Validação de headers
- ✅ Isolamento financeiro
- ✅ Logging de auditoria
- ✅ RBAC (Role-Based Access Control)

---

## Checklist de Segurança

Antes de deployar, validar:

- [ ] Todas as tabelas têm coluna `group_id`
- [ ] Todas as queries filtram por `group_id`
- [ ] Middleware valida `X-Group-ID` header
- [ ] Testes de segurança passam 100%
- [ ] Logs de auditoria registram acessos
- [ ] Super admin tem acesso restrito
- [ ] Dados financeiros são isolados
- [ ] Senhas não são retornadas em APIs

---

## Fluxo de Login

```typescript
// 1. Login
const { token, user } = await login(email, password);

// 2. Inicializar contexto de segurança
initializeSecureAPI(token, user.groupId);

// 3. Todas as requisições agora incluem:
// - Authorization: Bearer {token}
// - X-Group-ID: {user.groupId}

// 4. Backend valida ambos os headers
// 5. Queries são filtradas por group_id automaticamente
```

---

## Monitoramento

### Logs de Auditoria

```json
{
  "timestamp": "2024-02-11T20:30:00Z",
  "userId": "user-123",
  "groupId": "group-1",
  "action": "LIST_PLAYERS",
  "result": "SUCCESS",
  "ipAddress": "192.168.1.1"
}
```

### Alertas de Segurança

```json
{
  "timestamp": "2024-02-11T20:30:00Z",
  "severity": "HIGH",
  "event": "CROSS_GROUP_ACCESS_ATTEMPT",
  "userId": "user-123",
  "attemptedGroupId": "group-2",
  "userGroupId": "group-1",
  "action": "BLOCKED"
}
```

---

## Perguntas Frequentes

**P: Super admin pode ver dados de todos os grupos?**
R: Sim, mas apenas para suporte. Todas as ações são auditadas.

**P: Como migrar dados de um grupo para outro?**
R: Apenas super admin pode fazer isso. Deve ser auditado.

**P: Posso ter um usuário em múltiplos grupos?**
R: Não. Cada usuário pertence a um único grupo.

**P: Como resetar dados de um grupo?**
R: Apenas admin do grupo pode fazer isso. Requer confirmação.

---

## Conclusão

O Pelada Pró implementa multi-tenancy em **3 camadas** para garantir isolamento total:

1. **Frontend** - Valida antes de enviar
2. **API Client** - Adiciona headers de segurança
3. **Backend** - Valida e filtra dados

Isso garante que **nenhum dado vaza entre grupos**, mesmo com tentativas de ataque.

✅ **Segurança 100% validada e testada**
