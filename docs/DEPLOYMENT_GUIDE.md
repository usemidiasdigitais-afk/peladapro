# 🚀 Guia de Deployment - Pelada Pró

## 📋 Pré-requisitos

### Ambiente Local
- Node.js 18+
- PostgreSQL 14+
- Git
- npm ou pnpm

### Ambiente de Produção
- Linux server (Ubuntu 20.04+)
- Docker (opcional)
- PostgreSQL 14+ gerenciado
- Redis (opcional)
- SSL/TLS certificate

## 🔧 Preparação

### 1. Clonar Repositório

```bash
git clone https://github.com/seu-usuario/pelada-pro.git
cd pelada-pro
```

### 2. Instalar Dependências

```bash
npm install
# ou
pnpm install
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com valores reais
nano .env
```

### Variáveis Obrigatórias

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pelada_pro

# JWT
JWT_SECRET=your-secret-key-min-32-chars-here-12345
JWT_EXPIRATION=7d
JWT_REFRESH_EXPIRATION=30d

# Asaas
ASAAS_API_KEY=your_asaas_api_key_here
ASAAS_ENVIRONMENT=sandbox  # ou production
ASAAS_WEBHOOK_SECRET=your_webhook_secret_here

# Google Places
GOOGLE_PLACES_API_KEY=your_google_places_api_key_here

# WhatsApp
WHATSAPP_API_KEY=your_whatsapp_api_key_here

# Server
PORT=3000
NODE_ENV=development  # ou production

# Logging
LOG_LEVEL=info
AUDIT_LOG_ENABLED=true
```

### Variáveis Opcionais

```bash
# Redis (para caching)
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Email (para notificações)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

## 🗄️ Database Setup

### 1. Criar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco
CREATE DATABASE pelada_pro;
CREATE USER pelada_user WITH PASSWORD 'strong_password_here';
ALTER ROLE pelada_user SET client_encoding TO 'utf8';
ALTER ROLE pelada_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE pelada_user SET default_transaction_deferrable TO on;
ALTER ROLE pelada_user SET default_transaction_read_committed TO on;
GRANT ALL PRIVILEGES ON DATABASE pelada_pro TO pelada_user;
```

### 2. Executar Migrations

```bash
# Gerar migrations
npm run db:generate

# Executar migrations
npm run db:push

# Verificar status
npm run db:status
```

### 3. Seed de Dados (Opcional)

```bash
npm run db:seed
```

## 🏗️ Build e Testes

### 1. Verificar Tipos

```bash
npm run check
```

### 2. Executar Linter

```bash
npm run lint
```

### 3. Executar Testes

```bash
# Todos os testes
npm test

# Testes de segurança
npm test -- security*.test.ts

# Com cobertura
npm test -- --coverage
```

### 4. Build

```bash
npm run build
```

## 🐳 Deployment com Docker

### 1. Criar Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Instalar dependências
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copiar código
COPY . .

# Build
RUN npm run build

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start
CMD ["npm", "start"]
```

### 2. Criar docker-compose.yml

```yaml
version: '3.8'

services:
  db:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: pelada_pro
      POSTGRES_USER: pelada_user
      POSTGRES_PASSWORD: strong_password_here
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pelada_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://pelada_user:strong_password_here@db:5432/pelada_pro
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      ASAAS_API_KEY: ${ASAAS_API_KEY}
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs

volumes:
  postgres_data:
```

### 3. Build e Run

```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Logs
docker-compose logs -f app

# Stop
docker-compose down
```

## ☁️ Deployment no Heroku

### 1. Preparar Heroku

```bash
# Instalar Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login
heroku login

# Criar app
heroku create pelada-pro
```

### 2. Adicionar PostgreSQL

```bash
heroku addons:create heroku-postgresql:standard-0 -a pelada-pro
```

### 3. Configurar Variáveis

```bash
heroku config:set JWT_SECRET=your-secret-key -a pelada-pro
heroku config:set ASAAS_API_KEY=your_asaas_api_key -a pelada-pro
heroku config:set ASAAS_ENVIRONMENT=production -a pelada-pro
heroku config:set ASAAS_WEBHOOK_SECRET=your_webhook_secret -a pelada-pro
heroku config:set GOOGLE_PLACES_API_KEY=your_google_places_api_key -a pelada-pro
heroku config:set WHATSAPP_API_KEY=your_whatsapp_api_key -a pelada-pro
heroku config:set NODE_ENV=production -a pelada-pro
```

### 4. Deploy

```bash
# Adicionar remote
heroku git:remote -a pelada-pro

# Deploy
git push heroku main

# Executar migrations
heroku run npm run db:push -a pelada-pro

# Logs
heroku logs --tail -a pelada-pro
```

## 🌐 Deployment no AWS

### 1. Criar EC2 Instance

```bash
# Ubuntu 20.04, t3.medium, 20GB SSD
# Security groups: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (API)
```

### 2. Conectar e Configurar

```bash
# SSH
ssh -i key.pem ubuntu@your-instance-ip

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2
sudo npm install -g pm2
```

### 3. Clonar Repositório

```bash
cd /home/ubuntu
git clone https://github.com/seu-usuario/pelada-pro.git
cd pelada-pro
```

### 4. Instalar Dependências

```bash
npm install
npm run build
```

### 5. Configurar PostgreSQL

```bash
# Conectar como postgres
sudo -u postgres psql

# Criar banco
CREATE DATABASE pelada_pro;
CREATE USER pelada_user WITH PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE pelada_pro TO pelada_user;
\q
```

### 6. Configurar Variáveis

```bash
# Criar arquivo .env
nano .env

# Adicionar variáveis (veja seção anterior)
```

### 7. Executar Migrations

```bash
npm run db:push
```

### 8. Iniciar com PM2

```bash
# Criar ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'pelada-pro',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Iniciar
pm2 start ecosystem.config.js

# Salvar configuração
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### 9. Configurar Nginx

```bash
# Criar arquivo de configuração
sudo nano /etc/nginx/sites-available/pelada-pro

# Adicionar:
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Habilitar site
sudo ln -s /etc/nginx/sites-available/pelada-pro /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 10. Configurar SSL com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Auto-renew
sudo systemctl enable certbot.timer
```

## 🔒 Segurança em Produção

### 1. Firewall

```bash
# UFW
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
```

### 2. Backup de Banco de Dados

```bash
# Script de backup diário
sudo nano /usr/local/bin/backup-pelada.sh

#!/bin/bash
BACKUP_DIR="/backups/pelada-pro"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="pelada_pro"
DB_USER="pelada_user"

mkdir -p $BACKUP_DIR
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/backup_$TIMESTAMP.sql.gz

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Tornar executável
sudo chmod +x /usr/local/bin/backup-pelada.sh

# Agendar com cron
sudo crontab -e
# Adicionar: 0 2 * * * /usr/local/bin/backup-pelada.sh
```

### 3. Monitoramento

```bash
# Instalar PM2 Plus
pm2 install pm2-auto-pull
pm2 install pm2-logrotate

# Configurar alertas
pm2 monit
```

### 4. Logs

```bash
# Configurar rotação de logs
sudo nano /etc/logrotate.d/pelada-pro

/home/ubuntu/pelada-pro/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
}
```

## ✅ Checklist de Deployment

Antes de fazer deploy em produção:

- [ ] Todos os testes passando (`npm test`)
- [ ] Build sem erros (`npm run build`)
- [ ] Variáveis de ambiente configuradas
- [ ] Database migrations executadas
- [ ] SSL/TLS certificate configurado
- [ ] Backups de banco de dados configurados
- [ ] Monitoramento e alertas configurados
- [ ] Rate limiting habilitado
- [ ] CORS configurado corretamente
- [ ] Logging habilitado
- [ ] Security headers presentes
- [ ] Firewall configurado
- [ ] Senha forte do banco de dados
- [ ] JWT_SECRET forte (min 32 chars)
- [ ] Asaas API key em produção
- [ ] Google Places API key configurada
- [ ] WhatsApp API key configurada
- [ ] Email de suporte configurado
- [ ] Documentação atualizada
- [ ] Plano de disaster recovery

## 📊 Monitoramento em Produção

### Métricas Importantes

```bash
# CPU e Memória
top
free -h
df -h

# Logs
tail -f /home/ubuntu/pelada-pro/logs/app.log
tail -f /home/ubuntu/pelada-pro/logs/error.log

# Banco de dados
sudo -u postgres psql -d pelada_pro -c "SELECT * FROM pg_stat_statements LIMIT 10;"

# Conexões
sudo -u postgres psql -d pelada_pro -c "SELECT count(*) FROM pg_stat_activity;"
```

### Health Check

```bash
# Verificar se API está respondendo
curl -s http://localhost:3000/health | jq .

# Resposta esperada
{
  "status": "ok",
  "timestamp": "2024-02-12T10:30:00Z",
  "uptime": 3600
}
```

## 🔄 Processo de Atualização

### 1. Preparar Atualização

```bash
# Pull latest code
git pull origin main

# Instalar novas dependências
npm install

# Build
npm run build

# Testes
npm test
```

### 2. Backup Pré-atualização

```bash
# Backup do banco
pg_dump -U pelada_user pelada_pro | gzip > backup_pre_update.sql.gz

# Backup do código
cp -r /home/ubuntu/pelada-pro /home/ubuntu/pelada-pro.backup
```

### 3. Deploy Atualização

```bash
# Parar aplicação
pm2 stop pelada-pro

# Executar migrations
npm run db:push

# Iniciar aplicação
pm2 start pelada-pro

# Verificar logs
pm2 logs pelada-pro
```

### 4. Rollback se Necessário

```bash
# Parar aplicação
pm2 stop pelada-pro

# Restaurar código
rm -rf /home/ubuntu/pelada-pro
cp -r /home/ubuntu/pelada-pro.backup /home/ubuntu/pelada-pro

# Restaurar banco (se necessário)
psql -U pelada_user pelada_pro < backup_pre_update.sql

# Iniciar aplicação
pm2 start pelada-pro
```

## 📞 Suporte e Troubleshooting

### Problema: Aplicação não inicia

```bash
# Verificar logs
pm2 logs pelada-pro

# Verificar variáveis de ambiente
env | grep DATABASE_URL

# Verificar conexão com banco
psql -U pelada_user -d pelada_pro -c "SELECT 1"
```

### Problema: Banco de dados lento

```bash
# Analisar queries lentas
sudo -u postgres psql -d pelada_pro -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Recriar índices
npm run db:index:rebuild
```

### Problema: Memória alta

```bash
# Verificar processos
ps aux | grep node

# Reiniciar aplicação
pm2 restart pelada-pro

# Verificar logs de erro
pm2 logs pelada-pro --err
```

---

**Pelada Pró** - Deployment Guide v1.0
