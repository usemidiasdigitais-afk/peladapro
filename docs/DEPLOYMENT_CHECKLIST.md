# ✅ Checklist de Deployment - Pelada Pró

## 🎯 Pré-Deployment (Semana Anterior)

### Código e Testes
- [ ] Todos os testes passando (`npm test`)
- [ ] Cobertura > 95% (`npm test -- --coverage`)
- [ ] Build sem erros (`npm run build`)
- [ ] Lint sem warnings (`npm run lint`)
- [ ] TypeScript sem erros (`npm run check`)
- [ ] Sem console.log em produção
- [ ] Sem TODO/FIXME em código crítico
- [ ] Code review aprovado
- [ ] Changelog atualizado

### Segurança
- [ ] Testes de penetração passando
- [ ] Testes de fuzzing passando
- [ ] Testes de rate limiting passando
- [ ] Testes de autenticação passando
- [ ] Testes de multi-tenancy passando
- [ ] Sem vulnerabilidades conhecidas (`npm audit`)
- [ ] Dependências atualizadas
- [ ] JWT_SECRET forte (min 32 chars)
- [ ] Senhas do banco de dados fortes
- [ ] API keys em variáveis de ambiente

### Database
- [ ] Migrations testadas localmente
- [ ] Backup de dados existentes
- [ ] Rollback plan preparado
- [ ] Índices de performance criados
- [ ] Queries críticas otimizadas
- [ ] Conexão pooling configurada
- [ ] Timeout de conexão definido

### Documentação
- [ ] README atualizado
- [ ] API documentation atualizada
- [ ] Deployment guide revisado
- [ ] Runbook de troubleshooting preparado
- [ ] Contatos de suporte atualizados
- [ ] Changelog preparado

### Infraestrutura
- [ ] Servidor preparado (OS, packages)
- [ ] PostgreSQL instalado e configurado
- [ ] Redis instalado (se necessário)
- [ ] Nginx configurado
- [ ] SSL/TLS certificate obtido
- [ ] Firewall configurado
- [ ] Backups automatizados configurados
- [ ] Monitoramento configurado
- [ ] Logs configurados

### Variáveis de Ambiente
- [ ] DATABASE_URL definida
- [ ] JWT_SECRET definida
- [ ] ASAAS_API_KEY definida
- [ ] ASAAS_ENVIRONMENT = production
- [ ] ASAAS_WEBHOOK_SECRET definida
- [ ] GOOGLE_PLACES_API_KEY definida
- [ ] WHATSAPP_API_KEY definida
- [ ] NODE_ENV = production
- [ ] PORT definida
- [ ] LOG_LEVEL definida

---

## 🚀 Deployment Day (Dia da Entrega)

### 1. Backup Pré-Deployment (08:00)
- [ ] Backup do banco de dados
- [ ] Backup do código atual
- [ ] Backup de configurações
- [ ] Verificar integridade dos backups
- [ ] Testar restore de backup

### 2. Preparação do Servidor (09:00)
- [ ] Verificar espaço em disco
- [ ] Verificar memória disponível
- [ ] Verificar CPU
- [ ] Verificar conexão de rede
- [ ] Verificar conectividade com banco de dados
- [ ] Verificar conectividade com APIs externas

### 3. Deploy da Aplicação (10:00)
- [ ] Parar aplicação atual (se existir)
- [ ] Clonar/pull código novo
- [ ] Instalar dependências (`npm install`)
- [ ] Build aplicação (`npm run build`)
- [ ] Executar migrations (`npm run db:push`)
- [ ] Seed de dados (se necessário)
- [ ] Iniciar aplicação
- [ ] Verificar logs de startup

### 4. Verificação de Saúde (11:00)
- [ ] Health check endpoint respondendo
- [ ] Database conectado
- [ ] APIs externas conectadas
- [ ] Rate limiting funcionando
- [ ] Logging funcionando
- [ ] Monitoramento funcionando

### 5. Testes Pós-Deployment (12:00)
- [ ] Teste de login
- [ ] Teste de criar partida
- [ ] Teste de sorteio preditivo
- [ ] Teste de pagamento (sandbox)
- [ ] Teste de webhook
- [ ] Teste de multi-tenancy
- [ ] Teste de rate limiting
- [ ] Teste de error handling

### 6. Monitoramento (13:00+)
- [ ] Monitorar CPU
- [ ] Monitorar memória
- [ ] Monitorar disco
- [ ] Monitorar latência
- [ ] Monitorar erros
- [ ] Monitorar requisições
- [ ] Monitorar banco de dados
- [ ] Monitorar APIs externas

---

## 📊 Verificações de Performance

### Response Time
- [ ] Home page < 500ms
- [ ] API endpoint < 200ms (p95)
- [ ] Database query < 50ms (p95)
- [ ] Sem timeouts

### Throughput
- [ ] Suportar 100+ req/s
- [ ] Suportar 1000+ usuários simultâneos
- [ ] Sem degradação de performance

### Uptime
- [ ] 99.9% uptime
- [ ] Sem crashes
- [ ] Sem memory leaks

---

## 🔐 Verificações de Segurança

### Autenticação
- [ ] JWT tokens sendo gerados
- [ ] JWT tokens sendo validados
- [ ] Refresh tokens funcionando
- [ ] Logout limpando tokens
- [ ] Sem tokens em logs

### Autorização
- [ ] Multi-tenancy funcionando
- [ ] WHERE group_id em todas as queries
- [ ] Sem cross-group access
- [ ] Roles sendo validadas

### Rate Limiting
- [ ] Rate limiting ativo
- [ ] 429 responses corretos
- [ ] Retry-After headers presentes
- [ ] Sem bypass de rate limiting

### Logging
- [ ] Logs sendo gerados
- [ ] Logs sendo armazenados
- [ ] Audit logs funcionando
- [ ] Sem dados sensíveis em logs

### Webhooks
- [ ] Webhooks sendo recebidos
- [ ] Assinatura sendo validada
- [ ] Timestamp sendo verificado
- [ ] Sem replay attacks

---

## 🐛 Troubleshooting Rápido

### Aplicação não inicia
- [ ] Verificar logs: `pm2 logs pelada-pro`
- [ ] Verificar variáveis de ambiente
- [ ] Verificar conexão com banco
- [ ] Verificar espaço em disco
- [ ] Verificar permissões de arquivo

### Banco de dados lento
- [ ] Verificar índices
- [ ] Verificar queries lentas
- [ ] Verificar conexão pooling
- [ ] Reiniciar PostgreSQL
- [ ] Verificar tamanho do banco

### Memória alta
- [ ] Verificar memory leaks
- [ ] Reiniciar aplicação
- [ ] Aumentar limite de memória
- [ ] Verificar logs de erro

### Taxa de erro alta
- [ ] Verificar logs de erro
- [ ] Verificar conectividade com APIs
- [ ] Verificar banco de dados
- [ ] Verificar rate limiting
- [ ] Verificar firewall

---

## 📞 Contatos de Emergência

| Papel | Nome | Telefone | Email |
|------|------|----------|-------|
| DevOps Lead | [Nome] | +55 11 99999-9999 | devops@peladapro.com |
| Backend Lead | [Nome] | +55 11 99999-9998 | backend@peladapro.com |
| Database Admin | [Nome] | +55 11 99999-9997 | dba@peladapro.com |
| Security Lead | [Nome] | +55 11 99999-9996 | security@peladapro.com |

---

## 📋 Pós-Deployment (Próximos 7 Dias)

### Dia 1
- [ ] Monitorar 24 horas
- [ ] Coletar feedback de usuários
- [ ] Verificar métricas de performance
- [ ] Verificar logs de erro
- [ ] Verificar segurança

### Dia 2-3
- [ ] Testes de carga
- [ ] Testes de penetração
- [ ] Testes de failover
- [ ] Testes de backup/restore

### Dia 4-7
- [ ] Análise de performance
- [ ] Otimizações necessárias
- [ ] Documentação de lições aprendidas
- [ ] Planejamento de próxima release

---

## 🎯 Critérios de Sucesso

### Deployment Bem-Sucedido Se:
- ✅ Aplicação iniciou sem erros
- ✅ Todos os endpoints respondendo
- ✅ Database conectado
- ✅ Sem erros críticos nos logs
- ✅ Performance dentro do esperado
- ✅ Uptime > 99%
- ✅ Sem data loss
- ✅ Sem security breaches

### Rollback Se:
- ❌ Aplicação não inicia
- ❌ Database não conecta
- ❌ Erros críticos nos logs
- ❌ Performance degradada > 50%
- ❌ Uptime < 95%
- ❌ Data loss detectado
- ❌ Security breach detectado
- ❌ Funcionalidade crítica quebrada

---

## 📝 Notas Importantes

1. **Sempre fazer backup antes de deployment**
2. **Testar migrations em staging primeiro**
3. **Ter rollback plan preparado**
4. **Monitorar 24 horas após deployment**
5. **Comunicar com time de suporte**
6. **Documentar qualquer issue encontrado**
7. **Fazer post-mortem se necessário**

---

## 🔄 Checklist de Rollback

Se precisar fazer rollback:

- [ ] Parar aplicação atual
- [ ] Restaurar código anterior
- [ ] Restaurar banco de dados
- [ ] Reiniciar aplicação
- [ ] Verificar se tudo está funcionando
- [ ] Notificar usuários
- [ ] Investigar causa do problema
- [ ] Preparar fix
- [ ] Fazer novo deployment

---

**Pelada Pró** - Deployment Checklist v1.0  
Última atualização: Fevereiro 2024
