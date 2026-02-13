# Guia de Pagamentos PIX - Pelada Pró

## Visão Geral

O Pelada Pró implementa **pagamentos PIX automáticos** via Asaas com **isolamento total por grupo**.

Cada grupo pode:
- ✅ Configurar sua própria chave Asaas
- ✅ Receber pagamentos PIX de jogadores
- ✅ Ver apenas seus próprios pagamentos
- ✅ Gerenciar cobranças e confirmações

---

## Arquitetura

### Fluxo de Pagamento

```
┌──────────────────────────────────────────────────────┐
│ 1. Admin configura API Asaas (por grupo)             │
│    - Chave da API                                    │
│    - Ambiente (Sandbox/Produção)                     │
│    - URL do Webhook                                  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 2. Jogador entra na partida e precisa pagar          │
│    - Clica em "Pagar com PIX"                        │
│    - Sistema gera cobrança no Asaas                  │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 3. QR Code PIX é exibido                             │
│    - Escaneável com qualquer banco                   │
│    - Válido por 15 minutos                           │
│    - Chave PIX copiável                              │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 4. Jogador paga via seu banco                        │
│    - Transferência PIX instantânea                   │
│    - Confirmação em tempo real                       │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 5. Asaas envia webhook confirmando                   │
│    - Validação de assinatura                         │
│    - Atualização de status                           │
│    - Emissão de recibo                               │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 6. Jogador vê confirmação no app                     │
│    - Status atualizado                               │
│    - Presença confirmada                             │
│    - Acesso à partida liberado                       │
└──────────────────────────────────────────────────────┘
```

---

## Configuração

### 1. Obter Chave Asaas

1. Acesse https://asaas.com
2. Crie uma conta (ou faça login)
3. Vá para **Configurações → API**
4. Copie sua **chave de API**

### 2. Configurar no App

1. Abra **Configurações de Pagamento**
2. Cole a **chave da API**
3. Selecione o **ambiente**:
   - 🧪 **Sandbox**: Para testes (sem dinheiro real)
   - 🚀 **Produção**: Para cobranças reais
4. Configure a **URL do Webhook** (opcional)
5. Clique em **Salvar Configurações**

---

## Implementação

### Serviço Asaas

```typescript
import { getAsaasService, initializeAsaas } from '@/services/asaas-payment-service';

// Inicializar com configurações do grupo
await initializeAsaas(groupId);

const asaas = getAsaasService();

// Criar cobrança PIX
const charge = await asaas.createPixCharge({
  groupId,
  customer: {
    name: 'João Silva',
    email: 'joao@example.com',
  },
  amount: 5000, // R$ 50.00 em centavos
  description: 'Pagamento de participação - Partida 123',
  dueDate: '2024-02-12',
});

// charge.id = ID da cobrança
// charge.pixQrCode = QR Code em base64
// charge.pixCopiaeCola = Chave PIX para copiar
```

### Tela de Pagamento

```typescript
import PixPaymentScreen from '@/app/pix-payment';

// Usar na navegação
<Stack.Screen
  name="pix-payment"
  component={PixPaymentScreen}
  options={{
    title: 'Pagamento PIX',
  }}
/>

// Navegar para tela
navigation.navigate('pix-payment', {
  matchId: 'match-123',
  amount: 5000, // R$ 50.00
  playerName: 'João Silva',
});
```

---

## Isolamento por Grupo

### Validação em 3 Camadas

**1. Frontend**
```typescript
const { getCurrentGroupId } = useMultiTenancy();
const groupId = getCurrentGroupId();

// Validar antes de criar cobrança
if (!groupId) throw new Error('Grupo não identificado');
```

**2. API Client**
```typescript
const api = getSecureAPIClient();

// Automaticamente adiciona X-Group-ID header
await api.post('/payments', {
  groupId, // Validado
  amount: 5000,
});
```

**3. Backend**
```typescript
// Middleware valida
if (req.headers['x-group-id'] !== req.user.groupId) {
  return res.status(403).json({ error: 'Access denied' });
}

// Query filtra por group_id
const payments = await db.query.payments.findMany({
  where: (payments, { eq }) => eq(payments.groupId, req.groupId),
});
```

### Garantias

- ✅ Admin1 **NÃO** consegue ver pagamentos de Admin2
- ✅ Dados financeiros isolados por grupo
- ✅ Webhooks validados com group_id
- ✅ Relatórios específicos por grupo

---

## Webhook

### Configurar Webhook

1. Vá para **Configurações de Pagamento**
2. Cole a URL do webhook:
   ```
   https://seu-dominio.com/api/webhooks/asaas
   ```

### Processar Webhook

```typescript
// POST /api/webhooks/asaas
app.post('/api/webhooks/asaas', async (req, res) => {
  const { payload, signature } = req.body;
  const groupId = req.headers['x-group-id'];

  // Validar assinatura
  const asaas = getAsaasService();
  if (!asaas.validateWebhookSignature(payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Processar evento
  await asaas.processWebhook(payload, groupId);

  res.json({ success: true });
});
```

### Eventos Suportados

- `PAYMENT_CONFIRMED` - Pagamento confirmado
- `PAYMENT_RECEIVED` - Dinheiro recebido
- `PAYMENT_OVERDUE` - Pagamento vencido

---

## Segurança

### Validações

- ✅ Chave Asaas armazenada de forma segura
- ✅ Nunca compartilhada com cliente
- ✅ Validação de assinatura em webhooks
- ✅ Rate limiting em criação de cobranças
- ✅ Isolamento por group_id em todas as queries

### Boas Práticas

1. **Nunca exponha a chave Asaas** no frontend
2. **Sempre valide group_id** antes de processar
3. **Registre todas as transações** em auditoria
4. **Use HTTPS** para webhooks
5. **Teste em Sandbox** antes de produção

---

## Testes

### Testes de Segurança

```bash
npm test -- pix-payment-security.test.ts
```

Testes cobrem:
- ✅ Isolamento de pagamentos
- ✅ Proteção de dados financeiros
- ✅ Validação de webhooks
- ✅ Validação de requisições API
- ✅ Criação de cobranças
- ✅ Atualizações de status
- ✅ Logging de auditoria
- ✅ Rate limiting

### Teste Manual

1. Vá para **Configurações de Pagamento**
2. Cole uma chave Asaas de **Sandbox**
3. Clique em **Testar Conexão**
4. Crie uma cobrança de teste
5. Valide que o QR Code foi gerado

---

## Troubleshooting

### Erro: "Chave da API inválida"

**Causa**: Chave Asaas incorreta ou expirada

**Solução**:
1. Verifique a chave em https://asaas.com/api
2. Copie novamente
3. Salve as configurações

### Erro: "QR Code não gerado"

**Causa**: Problema na comunicação com Asaas

**Solução**:
1. Verifique a conexão de internet
2. Teste em Sandbox primeiro
3. Verifique logs de erro

### Pagamento não confirma

**Causa**: Webhook não configurado ou assinatura inválida

**Solução**:
1. Configure a URL do webhook
2. Valide a assinatura
3. Verifique logs de webhook

---

## Exemplo Completo

```typescript
// 1. Configurar Asaas
await initializeAsaas('group-1');

// 2. Criar cobrança
const charge = await asaas.createPixCharge({
  groupId: 'group-1',
  customer: {
    name: 'João Silva',
    email: 'joao@example.com',
  },
  amount: 5000, // R$ 50.00
  description: 'Pagamento de participação',
  dueDate: '2024-02-12',
});

// 3. Exibir QR Code
console.log('QR Code:', charge.pixQrCode);
console.log('Chave PIX:', charge.pixCopiaeCola);

// 4. Aguardar webhook
// Asaas envia: PAYMENT_CONFIRMED

// 5. Processar webhook
await asaas.processWebhook(payload, 'group-1');

// 6. Atualizar status no app
// UI mostra: "Pagamento Confirmado ✓"
```

---

## Conclusão

O Pelada Pró oferece **pagamentos PIX seguros e isolados por grupo**:

✅ Configuração simples  
✅ Isolamento total de dados  
✅ Confirmação automática  
✅ Auditoria completa  
✅ Pronto para produção  

Comece a receber pagamentos PIX agora! 🚀
