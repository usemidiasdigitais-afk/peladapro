# 🚀 Guia de Deployment em Produção

**Pelada Pró** é uma plataforma SaaS multi-tenant pronta para produção. Este guia detalha o processo de deployment, configuração e operação.

---

## 📋 Pré-Requisitos

### Infraestrutura

- **Servidor:** AWS EC2, DigitalOcean, Heroku ou similar
- **Banco de Dados:** PostgreSQL 14+ gerenciado (AWS RDS, DigitalOcean Managed)
- **Cache:** Redis (opcional, para sessions)
- **Armazenamento:** S3 ou equivalente (para uploads)
- **DNS:** Domínio próprio configurado

### Dependências Externas

- **Asaas API:** Conta ativa com API key
- **Google Places API:** Chave de API para autocomplete
- **WhatsApp Business API:** Conta configurada (opcional)
- **SendGrid/Mailgun:** Para emails (opcional)

### Variáveis de Ambiente

```bash
# Banco de Dados
DATABASE_URL=postgresql://user:password@host:5432/pelada_pro
DATABASE_SSL=true

# JWT
JWT_SECRET=sua-chave-secreta-super-segura-min-32-caracteres
JWT_EXPIRY=24h

# Asaas
ASAAS_API_KEY=sua-chave-asaas
ASAAS_WEBHOOK_SECRET=seu-webhook-secret

# Google Places
GOOGLE_PLACES_API_KEY=sua-chave-google

# WhatsApp (opcional)
WHATSAPP_API_TOKEN=seu-token
WHATSAPP_PHONE_ID=seu-phone-id

# Email (opcional)
SENDGRID_API_KEY=sua-chave-sendgrid

# Aplicação
NODE_ENV=production
PORT=3000
API_URL=https://api.seudomain.com
APP_URL=https://app.seudomain.com

# Logging
LOG_LEVEL=info
SENTRY_DSN=seu-sentry-dsn

# Rate Limiting
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🐳 Deployment com Docker

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependências
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm run build

# Cleanup
RUN pnpm prune --prod

# Runtime
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pelada_pro
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/pelada_pro
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      ASAAS_API_KEY: ${ASAAS_API_KEY}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

### Deploy com Docker Compose

```bash
# Preparar variáveis
cp .env.example .env
# Editar .env com valores reais

# Build e start
docker-compose up -d

# Verificar status
docker-compose ps

# Logs
docker-compose logs -f api

# Parar
docker-compose down
```

---

## ☁️ Deployment em Plataformas Gerenciadas

### AWS Elastic Beanstalk

```bash
# Instalar CLI
pip install awsebcli

# Inicializar
eb init -p "Node.js 20 running on 64bit Amazon Linux 2" pelada-pro

# Criar ambiente
eb create production

# Deploy
eb deploy

# Monitorar
eb logs
eb status
```

### Heroku

```bash
# Instalar CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Criar app
heroku create pelada-pro-prod

# Configurar variáveis
heroku config:set JWT_SECRET=xxx
heroku config:set ASAAS_API_KEY=xxx
heroku config:set DATABASE_URL=xxx

# Deploy
git push heroku main

# Monitorar
heroku logs --tail
```

### DigitalOcean App Platform

```bash
# Criar app.yaml
cat > app.yaml << EOF
name: pelada-pro
services:
- name: api
  github:
    repo: seu-repo/pelada-pro
    branch: main
  build_command: pnpm run build
  run_command: node dist/index.js
  http_port: 3000
  envs:
  - key: NODE_ENV
    value: production
  - key: JWT_SECRET
    scope: RUN_AND_BUILD_TIME
    value: ${JWT_SECRET}
databases:
- name: postgres
  engine: PG
  version: "16"
EOF

# Deploy
doctl apps create --spec app.yaml
```

---

## 🔐 Configuração de Segurança

### SSL/TLS

```bash
# Usar Let's Encrypt com Certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot certonly --standalone -d api.seudomain.com

# Renovação automática
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Nginx Reverse Proxy

```nginx
upstream api {
  server localhost:3000;
}

server {
  listen 80;
  server_name api.seudomain.com;
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name api.seudomain.com;

  ssl_certificate /etc/letsencrypt/live/api.seudomain.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.seudomain.com/privkey.pem;

  # Segurança
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers HIGH:!aNULL:!MD5;
  ssl_prefer_server_ciphers on;
  add_header Strict-Transport-Security "max-age=31536000" always;
  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  limit_req zone=api burst=20 nodelay;

  location / {
    proxy_pass http://api;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 90;
  }

  # Health check
  location /health {
    proxy_pass http://api;
    access_log off;
  }
}
```

---

## 📊 Monitoramento e Logging

### Estrutura de Logs

```typescript
// server/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Sentry para Error Tracking

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Middleware
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Prometheus para Métricas

```typescript
import prometheus from 'prom-client';

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

// Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });
  next();
});

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # Deploy script
          ./scripts/deploy.sh
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          PRODUCTION_SERVER: ${{ secrets.PRODUCTION_SERVER }}
```

---

## 📈 Scaling e Performance

### Horizontal Scaling

```yaml
# kubernetes deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pelada-pro-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: pelada-pro-api
  template:
    metadata:
      labels:
        app: pelada-pro-api
    spec:
      containers:
      - name: api
        image: seu-registry/pelada-pro:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pelada-pro-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Caching com Redis

```typescript
import redis from 'redis';

const redisClient = redis.createClient({
  url: process.env.REDIS_URL,
});

// Middleware de cache
export async function cacheMiddleware(req, res, next) {
  const cacheKey = `${req.method}:${req.path}`;
  const cached = await redisClient.get(cacheKey);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }

  const originalJson = res.json;
  res.json = function(data) {
    redisClient.setEx(cacheKey, 300, JSON.stringify(data)); // 5 min
    return originalJson.call(this, data);
  };

  next();
}
```

---

## 🔧 Manutenção e Operação

### Backup do Banco de Dados

```bash
# Backup manual
pg_dump -h localhost -U postgres pelada_pro > backup.sql

# Restaurar
psql -h localhost -U postgres pelada_pro < backup.sql

# Backup automático (cron)
0 2 * * * pg_dump -h localhost -U postgres pelada_pro | gzip > /backups/pelada_pro_$(date +\%Y\%m\%d).sql.gz
```

### Migração de Banco de Dados

```bash
# Gerar migration
pnpm drizzle-kit generate

# Aplicar migrations
pnpm drizzle-kit migrate

# Verificar status
pnpm drizzle-kit introspect
```

### Health Checks

```typescript
// server/api/health.ts
app.get('/health', async (req, res) => {
  try {
    // Verificar banco de dados
    const dbCheck = await db.query.users.findFirst();
    
    // Verificar Redis
    const redisCheck = await redisClient.ping();
    
    // Verificar Asaas
    const asaasCheck = await fetch('https://api.asaas.com/v3/ping', {
      headers: { 'Authorization': `Bearer ${process.env.ASAAS_API_KEY}` },
    });

    if (dbCheck && redisCheck === 'PONG' && asaasCheck.ok) {
      return res.json({ status: 'healthy', timestamp: new Date() });
    }
  } catch (error) {
    return res.status(503).json({ status: 'unhealthy', error: error.message });
  }
});
```

---

## 📋 Checklist de Deployment

- [ ] Variáveis de ambiente configuradas
- [ ] Certificado SSL/TLS instalado
- [ ] Banco de dados migrado
- [ ] Backup automático configurado
- [ ] Logging e monitoring ativo
- [ ] Rate limiting configurado
- [ ] CORS configurado corretamente
- [ ] Webhook Asaas configurado
- [ ] Health checks passando
- [ ] Testes de carga executados
- [ ] Documentação atualizada
- [ ] Runbook de operação criado

---

## 🚨 Troubleshooting

### Conexão com Banco de Dados Falha

```bash
# Verificar conexão
psql -h $DATABASE_HOST -U $DATABASE_USER -d pelada_pro -c "SELECT 1"

# Verificar logs
docker logs postgres

# Verificar variáveis
echo $DATABASE_URL
```

### Webhook Asaas Não Funciona

```bash
# Verificar configuração
curl -X GET https://api.asaas.com/v3/settings \
  -H "Authorization: Bearer $ASAAS_API_KEY"

# Testar webhook manualmente
curl -X POST http://localhost:3000/webhooks/asaas \
  -H "Content-Type: application/json" \
  -d '{"event": "PAYMENT_RECEIVED", "data": {...}}'
```

### Performance Lenta

```bash
# Verificar índices
SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;

# Analisar query
EXPLAIN ANALYZE SELECT * FROM matches WHERE group_id = 'xxx';

# Verificar cache
redis-cli INFO stats
```

---

## 📚 Referências

- [PostgreSQL Production Setup](https://www.postgresql.org/docs/current/installation.html)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [Asaas API Documentation](https://docs.asaas.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
