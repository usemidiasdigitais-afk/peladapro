# 🔐 Credenciais de Acesso - Pelada Pró

**Data de Criação:** 12 de Fevereiro de 2026  
**Status:** ✅ Ativo

---

## 👤 Usuário Admin

| Campo | Valor |
|-------|-------|
| **Email** | usemidiasdigitais@gmail.com |
| **Senha** | Pelada@2026 |
| **Nome** | Admin Master |
| **Role** | ADMIN |
| **Telefone** | 11999999999 |
| **Status** | Ativo |

---

## 👥 Grupo

| Campo | Valor |
|-------|-------|
| **Nome** | Pelada Pró Master |
| **Email** | usemidiasdigitais@gmail.com |
| **Plano** | PREMIUM |
| **Status** | Ativo |

---

## 🧪 Testar Login

### Via cURL

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usemidiasdigitais@gmail.com",
    "password": "Pelada@2026"
  }'
```

### Resposta Esperada

```json
{
  "success": true,
  "user": {
    "id": "uuid-do-usuario",
    "email": "usemidiasdigitais@gmail.com",
    "name": "Admin Master",
    "role": "ADMIN",
    "groupId": "uuid-do-grupo"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📱 Testar no Celular

### 1. Abrir App Pelada Pró
- Instale o app no seu celular
- Abra a tela de login

### 2. Preencher Credenciais
- **Email:** usemidiasdigitais@gmail.com
- **Senha:** Pelada@2026

### 3. Clicar em "Entrar"
- Aguarde a autenticação
- Você será redirecionado para o dashboard

### 4. Explorar Funcionalidades
- ✅ Criar pelada
- ✅ Confirmar presença
- ✅ Gerar PIX
- ✅ Adicionar despesas de churrasco

---

## 🔄 Fluxo de Teste Completo

### Passo 1: Login
```
Email: usemidiasdigitais@gmail.com
Senha: Pelada@2026
```

### Passo 2: Criar Pelada
```
Sport: FOOTBALL
Data: 15/02/2026
Hora: 14:00
Local: Parque Central
Valor: R$ 50,00
Churrasco: R$ 100,00
Máx Jogadores: 11
```

### Passo 3: Confirmar Presença
- Clique em "Confirmar Presença"
- Você será adicionado à lista

### Passo 4: Gerar PIX
- Clique em "Gerar Cobrança"
- Escaneie o QR Code com seu banco
- Simule o pagamento

### Passo 5: Adicionar Despesas
- Clique em "Adicionar Despesa"
- Categoria: MEAT
- Descrição: Carnes para churrasco
- Valor: R$ 150,00

### Passo 6: Visualizar Débitos
- Os débitos serão calculados automaticamente
- Cada jogador verá quanto deve

---

## ⚠️ Segurança

### Importante:
1. **Altere a senha** após o primeiro login
2. **Não compartilhe** essas credenciais
3. **Use HTTPS** em produção
4. **Guarde em local seguro** (gestor de senhas)
5. **Ative 2FA** quando disponível

### Alterar Senha:
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "Pelada@2026",
    "newPassword": "NovaSenhaSegura123!"
  }'
```

---

## 🔑 Tokens JWT

### Access Token
- **Validade:** 24 horas
- **Uso:** Autenticar requisições à API
- **Header:** `Authorization: Bearer TOKEN`

### Refresh Token
- **Validade:** 7 dias
- **Uso:** Renovar access token expirado
- **Endpoint:** `POST /api/auth/refresh`

---

## 🐛 Troubleshooting

### Erro: "Email ou senha inválidos"
**Solução:**
1. Verifique se digitou corretamente
2. Verifique se o usuário foi criado
3. Verifique se o banco está conectado

### Erro: "Usuário inativo"
**Solução:**
1. Verifique se o usuário está ativo
2. Ative o usuário no banco de dados

### Erro: "Grupo não encontrado"
**Solução:**
1. Verifique se o grupo foi criado
2. Verifique se o group_id está correto

---

## 📊 Verificar Dados no Banco

### Listar Grupos
```sql
SELECT * FROM groups WHERE email = 'usemidiasdigitais@gmail.com';
```

### Listar Usuários
```sql
SELECT id, email, name, role, is_active FROM users 
WHERE email = 'usemidiasdigitais@gmail.com';
```

### Listar Sessões
```sql
SELECT * FROM sessions 
WHERE user_id = (SELECT id FROM users WHERE email = 'usemidiasdigitais@gmail.com');
```

---

## 🚀 Próximos Passos

1. ✅ Login com as credenciais acima
2. ✅ Explorar o app
3. ✅ Criar primeira pelada
4. ✅ Testar pagamento PIX
5. ✅ Adicionar jogadores
6. ✅ Calcular débitos
7. ✅ Reportar bugs/sugestões

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique este documento
2. Consulte os logs do servidor
3. Verifique a conexão com o banco
4. Contate o suporte

---

**Status:** ✅ Credenciais Ativas e Prontas para Uso!

Desenvolvido por: Manus AI  
Data: 12 de Fevereiro de 2026
