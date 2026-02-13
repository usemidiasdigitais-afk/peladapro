# Guia de Testes - Pelada Pró

## ✅ Testes Implementados

### 1. **Login & Session Persistence**

**Objetivo**: Verificar se group_id é persistido corretamente

**Passos**:
1. Acesse: http://localhost:3000/login
2. Digite qualquer email e senha
3. Clique em "Entrar"
4. Abra DevTools (F12) → Console
5. Execute: `localStorage.getItem('group_id')`
6. Deve retornar: `f47ac10b-58cc-4372-a567-0e02b2c3d479`

**Resultado Esperado**: ✅ group_id salvo no localStorage

---

### 2. **Dashboard Load**

**Objetivo**: Verificar se o dashboard carrega com dados

**Passos**:
1. Após login, você deve estar em: http://localhost:3000/dashboard
2. Verifique se:
   - ✅ Bem-vindo, {email}! aparece
   - ✅ Botão "🔄 Atualizar Dados" funciona
   - ✅ Métricas aparecem (mesmo que zeradas)

**Resultado Esperado**: ✅ Dashboard carrega sem erros

---

### 3. **API Endpoints**

#### 3.1 GET /api/matches

```bash
curl "http://localhost:3000/api/matches?group_id=f47ac10b-58cc-4372-a567-0e02b2c3d479"
```

**Resultado Esperado**: 
```json
[]
```
(Array vazio porque nenhuma partida foi criada no Supabase)

#### 3.2 POST /api/matches

```bash
curl -X POST "http://localhost:3000/api/matches" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-02-20T19:00:00Z",
    "location": "Parque do Bairro",
    "match_cost": 50,
    "max_players": 11,
    "sport": "FOOTBALL",
    "group_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "created_by": "a47ac10b-58cc-4372-a567-0e02b2c3d479"
  }'
```

**Resultado Esperado**: 
- ✅ Se Supabase configurado: Partida criada com sucesso
- ⚠️ Se Supabase não configurado: Erro de autenticação (esperado)

---

### 4. **Verificar Logs**

**No Console do Navegador** (F12):

```
✅ Usuário carregado do localStorage: {...}
✅ Buscando partidas para group_id: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

**No Terminal do Servidor**:

```
Criando partida com group_id: f47ac10b-58cc-4372-a567-0e02b2c3d479
Partida criada com sucesso: {...}
```

---

## 🔧 Configuração de Variáveis de Ambiente

### Para Testes Locais

Crie um arquivo `.env.local` na raiz do projeto web:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qtwduwqmewpktaemjqxw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
SUPABASE_KEY=sua_chave_service_role_aqui

# Asaas
ASAAS_API_KEY=$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjJhNGE0NjkxLTI0NDQtNDMwYS1hNTAwLTFjYjAxYmE5ZDNiYzo6JGFhY2hfMDg4MjE5M2EtYzZmMy00OWEzLTlmOGItZjNmOWY1MDZmY2Qx

# JWT
JWT_SECRET=sua_chave_jwt_min_32_caracteres_aqui
```

### Para Produção (Vercel)

Configure via **Settings → Environment Variables** no dashboard da Vercel.

---

## 📊 Checklist de Validação

### ✅ Antes de Deploy

- [ ] Login funciona e salva group_id
- [ ] Dashboard carrega sem erros
- [ ] API /api/matches retorna array (vazio ou com dados)
- [ ] Logs aparecem no console
- [ ] Nenhum erro 404 ou 500
- [ ] Variáveis de ambiente configuradas
- [ ] Código enviado para GitHub

### ✅ Após Deploy na Vercel

- [ ] URL da Vercel acessível
- [ ] Redirect de `/` para `/dashboard` funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] API responde corretamente
- [ ] Nenhum erro de CORS

---

## 🚨 Troubleshooting

### Problema: "Group ID não encontrado"

**Causa**: localStorage vazio após login

**Solução**:
1. Abra DevTools (F12)
2. Vá em **Application → Local Storage**
3. Verifique se `group_id` existe
4. Se não existir, faça login novamente

### Problema: API retorna erro 500

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
1. Verifique `.env.local`
2. Reinicie o servidor: `npm run dev`
3. Teste novamente

### Problema: Erro 404 na Vercel

**Causa**: Root directory configurado errado

**Solução**:
1. Vá em **Settings → General**
2. Altere **Root Directory** para `./web`
3. Faça um novo deploy

---

## 📝 Logs Esperados

### Login Bem-sucedido

```
✅ Dados salvos no localStorage: {
  id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
  email: 'seu@email.com',
  name: 'Admin Master',
  group_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  role: 'ADMIN'
}
✅ Cookies definidos com sucesso
```

### Dashboard Carregando

```
✅ Usuário carregado do localStorage: {...}
✅ Buscando partidas para group_id: f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### Partida Criada

```
Criando partida com group_id: f47ac10b-58cc-4372-a567-0e02b2c3d479
Partida criada com sucesso: {
  id: '...',
  sport: 'FOOTBALL',
  location: 'Parque do Bairro',
  ...
}
```

---

## 🎯 Próximos Passos

1. **Configurar Supabase**:
   - Copie a chave correta do Supabase
   - Adicione ao `.env.local`
   - Teste novamente

2. **Inserir Dados de Teste**:
   - Execute `insert-test-data.sql` no Supabase
   - Verifique se partidas aparecem no dashboard

3. **Deploy na Vercel**:
   - Configure variáveis de ambiente
   - Faça deploy
   - Teste em produção

---

**Testes prontos! 🚀**
