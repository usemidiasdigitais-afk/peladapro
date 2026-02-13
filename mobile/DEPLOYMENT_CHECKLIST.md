# Checklist de Deployment - Pelada Pró

Verificações essenciais antes de fazer deploy em produção.

---

## ✅ Pré-Deployment

### Código

- [ ] Todos os testes passando
  ```bash
  npm test
  ```

- [ ] Sem warnings ou erros de lint
  ```bash
  npm run lint
  ```

- [ ] Sem vulnerabilidades conhecidas
  ```bash
  npm audit
  ```

- [ ] Sem secrets em código
  ```bash
  git secrets --scan
  ```

- [ ] Versão atualizada em package.json
  ```json
  "version": "1.0.0"
  ```

- [ ] CHANGELOG.md atualizado

### Segurança

- [ ] JWT secret configurado
- [ ] Asaas API key configurado
- [ ] Webhook secret configurado
- [ ] CORS configurado corretamente
- [ ] HTTPS habilitado
- [ ] Rate limiting configurado
- [ ] Auditoria habilitada

### Performance

- [ ] Índices no banco de dados criados
- [ ] Cache configurado
- [ ] CDN configurado (se aplicável)
- [ ] Imagens otimizadas
- [ ] Bundle size < 5MB
- [ ] Response time < 200ms (p95)

### Banco de Dados

- [ ] Migrations executadas
  ```bash
  npm run db:migrate
  ```

- [ ] Backup configurado
- [ ] Replicação configurada
- [ ] Índices criados
- [ ] Constraints validados
- [ ] Dados de teste removidos

### Documentação

- [ ] README.md atualizado
- [ ] API documentation atualizado
- [ ] Deployment guide atualizado
- [ ] Troubleshooting guide atualizado
- [ ] Changelog atualizado

---

## ✅ Deployment

### App Mobile (iOS)

- [ ] Certificado de distribuição válido
- [ ] Provisioning profile válido
- [ ] Build number incrementado
- [ ] Version number atualizado
- [ ] App icons corretos
- [ ] Splash screen correto
- [ ] Testes em device real
- [ ] Testes em TestFlight
- [ ] App Store listing completo
- [ ] Screenshots em todas as resoluções
- [ ] Description atualizado
- [ ] Keywords otimizadas
- [ ] Privacy policy link
- [ ] Terms of service link

```bash
eas build --platform ios
eas submit --platform ios
```

### App Mobile (Android)

- [ ] Keystore válido
- [ ] Build number incrementado
- [ ] Version number atualizado
- [ ] App icons corretos
- [ ] Splash screen correto
- [ ] Testes em device real
- [ ] Testes em Google Play Console
- [ ] Play Store listing completo
- [ ] Screenshots em todas as resoluções
- [ ] Description atualizado
- [ ] Keywords otimizadas
- [ ] Privacy policy link
- [ ] Terms of service link
- [ ] Content rating completo

```bash
eas build --platform android
eas submit --platform android
```

### Painel Web (Next.js)

- [ ] Build sem erros
  ```bash
  npm run build
  ```

- [ ] Testes passando
  ```bash
  npm test
  ```

- [ ] Environment variables configuradas
- [ ] Database connection testada
- [ ] API endpoints testados
- [ ] SSL certificate válido
- [ ] Domain DNS configurado
- [ ] CDN configurado
- [ ] Monitoring configurado
- [ ] Logging configurado

```bash
npm run build
npm run start
```

### Backend API

- [ ] Build sem erros
  ```bash
  npm run build
  ```

- [ ] Testes passando
  ```bash
  npm test
  ```

- [ ] Environment variables configuradas
- [ ] Database migrations executadas
- [ ] Webhooks configurados
- [ ] Email service testado
- [ ] SMS service testado
- [ ] Asaas integration testada
- [ ] SSL certificate válido
- [ ] Domain DNS configurado
- [ ] Monitoring configurado
- [ ] Logging configurado
- [ ] Backup configurado
- [ ] Disaster recovery testado

```bash
npm run build
npm start
```

---

## ✅ Pós-Deployment

### Monitoramento

- [ ] Uptime monitoring ativo
- [ ] Error tracking ativo
- [ ] Performance monitoring ativo
- [ ] Database monitoring ativo
- [ ] API monitoring ativo
- [ ] User analytics ativo
- [ ] Alertas configurados

### Validação

- [ ] App mobile funciona em iOS
- [ ] App mobile funciona em Android
- [ ] Painel web funciona
- [ ] API endpoints respondendo
- [ ] Database conectando
- [ ] Webhooks funcionando
- [ ] Pagamentos processando
- [ ] Emails enviando
- [ ] Logs sendo registrados

### Comunicação

- [ ] Usuários notificados sobre lançamento
- [ ] Status page atualizado
- [ ] Changelog publicado
- [ ] Release notes publicadas
- [ ] Social media atualizado
- [ ] Email marketing enviado

---

## 🚨 Rollback

Se algo der errado:

1. **Parar o deployment**
   ```bash
   # Parar serviços
   systemctl stop peladapro-api
   systemctl stop peladapro-web
   ```

2. **Restaurar versão anterior**
   ```bash
   # Backend
   git checkout <previous-tag>
   npm run build
   npm start

   # Web
   git checkout <previous-tag>
   npm run build
   npm run start
   ```

3. **Restaurar banco de dados**
   ```bash
   # Restaurar backup
   psql -U postgres peladapro < backup.sql
   ```

4. **Notificar usuários**
   - Email
   - In-app notification
   - Status page

---

## 📊 Métricas de Sucesso

Após deployment, validar:

- [ ] Uptime > 99.9%
- [ ] Response time < 200ms (p95)
- [ ] Error rate < 0.1%
- [ ] User satisfaction > 4.5/5
- [ ] Zero security incidents
- [ ] Zero data loss
- [ ] Zero unauthorized access

---

## 📝 Logs e Monitoramento

### Logs Importantes

```bash
# Backend logs
tail -f /var/log/peladapro/api.log

# Web logs
tail -f /var/log/peladapro/web.log

# Database logs
tail -f /var/log/postgresql/postgresql.log

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitoramento

- Datadog
- New Relic
- Sentry
- LogRocket
- Google Analytics

---

## 🔐 Segurança Pós-Deployment

- [ ] SSL/TLS certificado válido
- [ ] HSTS header configurado
- [ ] CSP header configurado
- [ ] CORS header configurado
- [ ] X-Frame-Options header configurado
- [ ] X-Content-Type-Options header configurado
- [ ] Rate limiting ativo
- [ ] WAF (Web Application Firewall) ativo
- [ ] DDoS protection ativo
- [ ] Backup criptografado
- [ ] Audit logs habilitados

---

## 📞 Contatos de Emergência

- **CTO:** [email]
- **DevOps:** [email]
- **Security:** [email]
- **Support:** [email]

---

## 📋 Versões

| Versão | Data | Status |
|--------|------|--------|
| 1.0.0 | 2026-02-11 | ✅ Production |

---

**Última atualização:** 11 de Fevereiro de 2026
