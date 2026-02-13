# Guia de Deployment na Vercel - Pelada Pró

## 🚀 Pré-requisitos

1. **Conta na Vercel**: https://vercel.com
2. **Repositório GitHub**: usemidiasdigitais-afk/peladapro (já configurado)
3. **Variáveis de Ambiente**: Preparadas e prontas

## 📋 Passo 1: Conectar Repositório GitHub

1. Acesse https://vercel.com/dashboard
2. Clique em **"New Project"**
3. Selecione **"Import Git Repository"**
4. Procure por `peladapro` e selecione `usemidiasdigitais-afk/peladapro`
5. Clique em **"Import"**

## ⚙️ Passo 2: Configurar Projeto

### 2.1 Selecionar Framework
- **Framework**: Next.js (detectado automaticamente)
- **Root Directory**: `./web` ⚠️ **IMPORTANTE!**

### 2.2 Variáveis de Ambiente

Na tela de configuração, adicione as seguintes variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=https://qtwduwqmewpktaemjqxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0d2R1d3FlbXdwd2t0YWVtanF4dyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzM3ODk4OTc5LCJleHAiOjIwNTM0NzQ5Nzl9.EXAMPLE
SUPABASE_KEY=sua_chave_supabase_aqui
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJhNGE0NjkxLTI0NDQtNDMwYS1hNTAwLTFjYjAxYmE5ZDNiYzo6JGFhY2hfMDg4MjE5M2EtYzZmMy00OWEzLTlmOGItZjNmOWY1MDZmY2Qx
JWT_SECRET=sua_chave_jwt_min_32_caracteres_aqui
```

## 🔧 Passo 3: Configurações Avançadas (Opcional)

### 3.1 Build Command
```bash
npm run build
```

### 3.2 Output Directory
```
.next
```

### 3.3 Install Command
```bash
npm install
```

## ✅ Passo 4: Deploy

1. Clique em **"Deploy"**
2. Aguarde o build completar (5-10 minutos)
3. Você receberá uma URL como: `https://peladapro.vercel.app`

## 🔍 Verificar Deploy

Após o deploy, teste:

1. **Home Page**: https://seu-dominio.vercel.app/
   - Deve redirecionar para `/dashboard`

2. **Login**: https://seu-dominio.vercel.app/login
   - Deve carregar a página de login

3. **Dashboard**: https://seu-dominio.vercel.app/dashboard
   - Deve mostrar as métricas (após fazer login)

4. **API**: https://seu-dominio.vercel.app/api/matches?group_id=f47ac10b-58cc-4372-a567-0e02b2c3d479
   - Deve retornar array de partidas (vazio se nenhuma criada)

## 🚨 Solução de Problemas

### Erro 404 em todas as rotas

**Causa**: Root directory configurado errado

**Solução**:
1. Vá em **Settings → General**
2. Procure por **"Root Directory"**
3. Altere para `./web`
4. Clique em **"Save"**
5. Faça um novo deploy

### Erro 500 na API

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Vá em **Settings → Environment Variables**
2. Verifique se todas as variáveis estão presentes
3. Clique em **"Redeploy"** no dashboard

### Erro de CORS

**Causa**: Supabase não permitindo requisições

**Solução**:
1. Acesse https://supabase.com
2. Vá em **Settings → API**
3. Adicione seu domínio Vercel em **"Allowed Origins"**
4. Salve e faça um novo deploy

## 🔄 Redeployar Após Mudanças

Após fazer push de mudanças no GitHub:

1. Vercel detecta automaticamente
2. Inicia novo build
3. Deploy automático após sucesso

Ou manualmente:
1. Vá em **Deployments**
2. Clique em **"Redeploy"** no último deployment

## 📊 Monitorar Performance

1. Vá em **Analytics**
2. Visualize:
   - Tempo de resposta
   - Erros
   - Requisições

## 🔐 Segurança

- ✅ Variáveis sensíveis protegidas
- ✅ HTTPS automático
- ✅ DDoS protection incluído
- ✅ Backups automáticos

## 📞 Suporte

- **Documentação Vercel**: https://vercel.com/docs
- **Status Page**: https://www.vercel-status.com
- **Community**: https://github.com/vercel/next.js/discussions

---

**Pronto para deploy!** 🎉
