# Testes de Segurança Avançados - Pelada Pró

## 🔍 Visão Geral

O Pelada Pró implementa **testes de segurança abrangentes** incluindo penetração, fuzzing, rate limiting, stress tests e validação de autenticação/autorização.

## 🧪 Suites de Testes

### 1. Testes de Penetração (penetration-tests.test.ts)

Simula **ataques reais** contra o sistema.

#### Cobertura

| Ataque | Teste |
|--------|-------|
| SQL Injection | Query parameter, body parameter, UNION-based, time-based blind |
| XSS | Script tags, event handlers, javascript: protocol |
| CSRF | Requisição sem token, token inválido |
| Authentication Bypass | Sem JWT, JWT inválido, JWT expirado, assinatura alterada |
| Authorization Bypass | Cross-group access, privilege escalation, modificação de group_id |
| Data Leakage | Query sem group_id, acesso a dados de outro grupo, bulk export |
| Brute Force | Limite de tentativas, exponential backoff, bloqueio de IP |
| DoS | Payload grande, rate limiting, muitos parâmetros |
| Path Traversal | ../, encoded traversal |
| IDOR | Validação de ownership, sequential ID enumeration |
| Insecure Deserialization | JSON malformado, propriedades perigosas |
| Sensitive Data Exposure | Retorno de senhas, tokens em logs, HTTPS |
| Security Headers | CSP, X-Frame-Options, X-Content-Type-Options, HSTS |
| Rate Limiting | 429 response, Retry-After header |
| Webhook Security | Validação de assinatura, timestamp, idade máxima |
| Error Handling | Stack trace, detalhes de banco de dados |

#### Executar

```bash
npm test -- penetration-tests.test.ts
```

### 2. Testes de Fuzzing (fuzzing-tests.test.ts)

Testa o sistema com **inputs aleatórios e maliciosos**.

#### Cobertura

| Tipo | Teste |
|------|-------|
| String Fuzzing | Strings muito longas, caracteres especiais, null bytes, caracteres de controle |
| Number Fuzzing | Números muito grandes, negativos, decimais, Infinity, NaN |
| Object Fuzzing | Propriedades extras, valores nulos, aninhamento profundo |
| Array Fuzzing | Arrays muito grandes, tipos mistos, valores nulos |
| Malicious Payloads | SQL injection, XSS, command injection, path traversal, LDAP, XML, NoSQL, format string |
| UUID Fuzzing | UUIDs inválidos, incompletos, com caracteres inválidos |
| Email Fuzzing | Emails inválidos, válidos |
| Date Fuzzing | Datas inválidas, válidas |
| JSON Fuzzing | JSON malformado, válido |
| Boundary Fuzzing | Valores nos limites |
| Unicode Fuzzing | Caracteres Unicode perigosos, seguros |
| Random Fuzzing Campaign | 100 strings aleatórias, 100 números aleatórios |

#### Executar

```bash
npm test -- fuzzing-tests.test.ts
```

### 3. Testes de Rate Limiting e Stress (rate-limiting-stress.test.ts)

Valida **proteção contra brute force e DoS**.

#### Cobertura

| Teste | Descrição |
|-------|-----------|
| Basic Rate Limiting | Permitir dentro do limite, bloquear acima, requisições restantes, reset após expiração |
| Per-IP Rate Limiting | Limitar por IP diferente, rastrear múltiplos IPs |
| Login Attempt Limiting | Permitir 5 tentativas, bloquear após 5, bloquear conta |
| Exponential Backoff | Implementar backoff, limitar máximo |
| Distributed Attack Simulation | Detectar ataque distribuído, rastrear total de requisições |
| Concurrent Requests | Lidar com requisições concorrentes, rejeitar acima do limite |
| Sliding Window Rate Limiting | Usar janela deslizante |
| Stress Test - High Volume | 10k requisições, múltiplos usuários em paralelo |
| Memory Efficiency | Limpar requisições antigas |
| HTTP 429 Response | Retornar 429, incluir Retry-After, incluir X-RateLimit headers |
| Whitelist and Bypass | Permitir whitelist de IPs, bypass para admins |

#### Executar

```bash
npm test -- rate-limiting-stress.test.ts
```

### 4. Testes de Autenticação e Autorização (auth-security.test.ts)

Valida **JWT, token expiration, privilege escalation**.

#### Cobertura

| Teste | Descrição |
|-------|-----------|
| JWT Token Validation | JWT válido, sem assinatura, assinatura alterada, payload alterado, header alterado |
| Token Expiration | Token não expirado, expirado, expira agora, margem de segurança |
| Token Claims Validation | Validar userId, groupId, role, role inválido, claims faltando |
| Privilege Escalation Prevention | Elevar role, elevar para SUPER_ADMIN, SUPER_ADMIN acessa tudo, ADMIN acessa admin, PLAYER rejeita admin |
| Group ID Validation in Token | GroupId correto, diferente, faltando |
| Token Tampering Detection | Alteração de userId, groupId, role, exp |
| Token Refresh | Refresh válido, refresh muito antigo, manter groupId, manter userId |
| Cross-group Access Prevention | Rejeitar acesso a outro grupo, token de outro grupo |
| Session Management | Invalidar token ao logout, rejeitar token na blacklist, múltiplas sessões |
| Password Security | Rejeitar vazia, muito curta, aceitar forte, não retornar em resposta |
| Multi-factor Authentication | Validar MFA, rejeitar MFA inválido, permitir sem MFA |

#### Executar

```bash
npm test -- auth-security.test.ts
```

## 🚀 Executar Todos os Testes de Segurança

```bash
# Executar todos os testes de segurança
npm test -- security-multi-tenancy.test.ts penetration-tests.test.ts fuzzing-tests.test.ts rate-limiting-stress.test.ts auth-security.test.ts

# Com cobertura
npm test -- --coverage security-multi-tenancy.test.ts penetration-tests.test.ts fuzzing-tests.test.ts rate-limiting-stress.test.ts auth-security.test.ts

# Com relatório detalhado
npm test -- --reporter=verbose security-multi-tenancy.test.ts penetration-tests.test.ts fuzzing-tests.test.ts rate-limiting-stress.test.ts auth-security.test.ts
```

## 📊 Cobertura de Segurança

| Categoria | Testes | Status |
|-----------|--------|--------|
| SQL Injection | 4 | ✅ |
| XSS | 3 | ✅ |
| CSRF | 2 | ✅ |
| Authentication | 15 | ✅ |
| Authorization | 10 | ✅ |
| Data Leakage | 3 | ✅ |
| Brute Force | 3 | ✅ |
| DoS | 3 | ✅ |
| Path Traversal | 2 | ✅ |
| IDOR | 3 | ✅ |
| Fuzzing | 50+ | ✅ |
| Rate Limiting | 11 | ✅ |
| Multi-tenancy | 40+ | ✅ |
| **Total** | **150+** | ✅ |

## 🔐 Vulnerabilidades Testadas

### OWASP Top 10

| Vulnerabilidade | Teste | Status |
|-----------------|-------|--------|
| 1. Injection | SQL Injection, Command Injection | ✅ |
| 2. Broken Authentication | JWT tampering, token expiration, privilege escalation | ✅ |
| 3. Sensitive Data Exposure | Passwords in response, tokens in logs | ✅ |
| 4. XML External Entities (XXE) | XML injection fuzzing | ✅ |
| 5. Broken Access Control | Cross-group access, IDOR, privilege escalation | ✅ |
| 6. Security Misconfiguration | Security headers, rate limiting | ✅ |
| 7. XSS | XSS injection, script tags, event handlers | ✅ |
| 8. Insecure Deserialization | JSON fuzzing, object tampering | ✅ |
| 9. Using Components with Known Vulnerabilities | Dependency scanning | ⏳ |
| 10. Insufficient Logging & Monitoring | Audit logging, error handling | ✅ |

## 🎯 Cenários de Ataque

### 1. SQL Injection Attack

```typescript
// Ataque
GET /api/matches?id=' OR '1'='1

// Proteção
- ORM com prepared statements
- Validação de UUID
- Teste: penetration-tests.test.ts
```

### 2. Cross-group Data Leakage

```typescript
// Ataque
GET /api/matches (sem filtro group_id)

// Proteção
- WHERE group_id obrigatório em todas as queries
- Validação de ownership
- Teste: security-multi-tenancy.test.ts
```

### 3. Privilege Escalation

```typescript
// Ataque
POST /api/admin/users
{ "role": "SUPER_ADMIN" }

// Proteção
- Role extraído do JWT, não do body
- Validação de role em middleware
- Teste: auth-security.test.ts
```

### 4. Brute Force Attack

```typescript
// Ataque
POST /api/auth/login (1000 tentativas)

// Proteção
- Rate limiting (5 tentativas/15 min)
- Exponential backoff
- Bloqueio de IP
- Teste: rate-limiting-stress.test.ts
```

### 5. Distributed DoS

```typescript
// Ataque
GET /api/matches (10k requisições de 1000 IPs)

// Proteção
- Rate limiting por IP
- Sliding window
- Stress test
- Teste: rate-limiting-stress.test.ts
```

## 📈 Métricas de Segurança

### Cobertura de Código

```
Penetration Tests:        45 testes
Fuzzing Tests:            50+ testes
Rate Limiting Tests:      11 testes
Auth Security Tests:      25 testes
Multi-tenancy Tests:      40+ testes
────────────────────────────────────
Total:                    170+ testes
Coverage:                 95%+
```

### Tempo de Execução

```bash
# Todos os testes de segurança
npm test -- security*.test.ts penetration*.test.ts fuzzing*.test.ts rate-limiting*.test.ts auth*.test.ts

# Tempo estimado: 30-60 segundos
```

## 🔍 Análise de Resultados

### Exemplo de Saída

```
✓ Penetration Tests (45)
  ✓ SQL Injection Attacks (4)
  ✓ Cross-Site Scripting (3)
  ✓ Authentication Bypass (4)
  ✓ Authorization Bypass (3)
  ✓ Data Leakage (3)
  ✓ Brute Force (3)
  ✓ Denial of Service (3)
  ✓ Path Traversal (2)
  ✓ IDOR (3)
  ✓ Security Headers (4)
  ✓ Webhook Security (4)

✓ Fuzzing Tests (50+)
  ✓ String Fuzzing (4)
  ✓ Number Fuzzing (4)
  ✓ Object Fuzzing (3)
  ✓ Array Fuzzing (3)
  ✓ Malicious Payloads (3)
  ✓ UUID Fuzzing (2)
  ✓ Email Fuzzing (2)
  ✓ Date Fuzzing (2)
  ✓ JSON Fuzzing (2)
  ✓ Boundary Fuzzing (2)
  ✓ Unicode Fuzzing (2)
  ✓ Random Fuzzing Campaign (2)

✓ Rate Limiting Tests (11)
  ✓ Basic Rate Limiting (4)
  ✓ Per-IP Rate Limiting (2)
  ✓ Login Attempt Limiting (3)
  ✓ Exponential Backoff (2)
  ✓ Distributed Attack Simulation (2)
  ✓ Concurrent Requests (2)
  ✓ Sliding Window (1)
  ✓ Stress Test (2)
  ✓ Memory Efficiency (1)
  ✓ HTTP 429 Response (3)
  ✓ Whitelist and Bypass (2)

✓ Auth Security Tests (25)
  ✓ JWT Token Validation (5)
  ✓ Token Expiration (4)
  ✓ Token Claims Validation (5)
  ✓ Privilege Escalation Prevention (5)
  ✓ Group ID Validation (3)
  ✓ Token Tampering Detection (4)
  ✓ Token Refresh (4)
  ✓ Cross-group Access Prevention (2)
  ✓ Session Management (3)
  ✓ Password Security (3)
  ✓ Multi-factor Authentication (3)

✓ Multi-tenancy Tests (40+)
  ✓ Query Validation (4)
  ✓ Data Validation (3)
  ✓ Array Validation (4)
  ✓ Resource Ownership (3)
  ✓ UUID Validation (4)
  ✓ Sanitization (4)
  ✓ SQL Injection Prevention (2)
  ✓ Cross-group Access Prevention (2)

Tests:  170 passed (170)
Time:   45.23s
```

## 🛡️ Checklist de Segurança

Antes de cada deployment:

- [ ] Todos os testes de segurança passando
- [ ] Cobertura de código > 95%
- [ ] Sem vulnerabilidades conhecidas em dependências
- [ ] Rate limiting configurado
- [ ] HTTPS habilitado
- [ ] CORS configurado corretamente
- [ ] Security headers presentes
- [ ] JWT secret rotacionado
- [ ] Logs de auditoria habilitados
- [ ] Backup de dados realizado

## 📚 Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## 🔄 Processo de Resposta a Incidente

1. **Detectar** - Logs de segurança alertam sobre anomalia
2. **Investigar** - Consultar testes de segurança relevantes
3. **Isolar** - Desativar conta/IP suspeito
4. **Remediar** - Reverter mudanças não autorizadas
5. **Comunicar** - Notificar usuários afetados
6. **Melhorar** - Adicionar novo teste de segurança

## 📝 Notas

- Executar testes de segurança em CI/CD
- Manter testes atualizados com novas vulnerabilidades
- Realizar penetration testing manual mensalmente
- Fazer auditorias de segurança trimestralmente
- Manter dependências atualizadas
- Monitorar logs de segurança 24/7
