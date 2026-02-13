# Integração Asaas - Pagamentos PIX Automáticos

## 📋 Visão Geral

O Pelada Pró integra a **API Asaas** para gerar cobranças PIX dinâmicas e processar pagamentos automaticamente. Cada jogador recebe um QR Code único para pagar a partida + extras (churrasco, bebidas, etc).

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React Native)                   │
│  - Tela de Pagamentos                                        │
│  - Exibição de QR Code PIX                                   │
│  - Status em Tempo Real                                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + tRPC)                  │
│  - Endpoints de Pagamento                                    │
│  - Webhook Handler                                           │
│  - Validação de Assinatura                                   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Banco de Dados (PostgreSQL)               │
│  - asaas_payments (rastreia cobranças)                       │
│  - asaas_customers (cache de clientes)                       │
│  - webhook_logs (auditoria)                                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Asaas API (Sandbox/Production)            │
│  - Criar cobranças PIX                                       │
│  - Gerar QR Codes                                            │
│  - Confirmar Pagamentos                                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 Configuração de Ambiente

Adicione as seguintes variáveis de ambiente ao arquivo `.env`:

```bash
# Asaas API
ASAAS_API_KEY=your_asaas_api_key_here
ASAAS_ENVIRONMENT=sandbox  # ou 'production'
ASAAS_WEBHOOK_SECRET=your_webhook_secret_here

# Webhook
WEBHOOK_URL=https://seu-dominio.com  # URL pública para receber webhooks
```

### Obter Credenciais Asaas

1. Acesse [https://www.asaas.com](https://www.asaas.com)
2. Crie uma conta (ou use conta existente)
3. Vá para **Configurações > Integrações > API**
4. Copie a **API Key** (use a chave de Sandbox para testes)
5. Configure o **Webhook Secret** em **Configurações > Webhooks**

## 📊 Fluxo de Pagamento

### 1. Admin Cria Partida com Custos

```typescript
// Admin define:
// - Valor da partida: R$ 80
// - Churrasco: R$ 50
// - Total por jogador: R$ 130
```

### 2. Sistema Gera Cobrança PIX

```typescript
const payment = await trpc.paymentsAsaas.generatePixCharge.mutate({
  matchId: 'match-123',
  playerId: 'player-456',
  amount: '130.00',
  description: 'Partida de futebol + churrasco',
  daysUntilDue: 3
});

// Retorna:
// {
//   paymentId: 'payment-uuid',
//   asaasChargeId: 'asaas-charge-id',
//   amount: '130.00',
//   pixQrCode: 'base64-encoded-qr',
//   pixCopiaeCola: '00020126580014br.gov.bcb.pix...',
//   dueDate: '2024-02-15',
//   status: 'PENDING'
// }
```

### 3. Jogador Escaneia QR Code

- Abre o app do banco
- Escaneia o QR Code
- Confirma o pagamento

### 4. Webhook Confirma Pagamento

```
Asaas → POST /webhooks/asaas
{
  "event": "payment.confirmed",
  "data": {
    "id": "asaas-charge-id",
    "status": "CONFIRMED",
    "value": 130.00,
    "externalReference": "match-123"
  }
}
```

### 5. Sistema Atualiza Status

```typescript
// Status muda de PENDING → CONFIRMED → RECEIVED
// Notificação enviada ao admin e jogador
```

## 🔌 Endpoints tRPC

### Gerar Cobrança PIX

```typescript
// Criar nova cobrança
const result = await trpc.paymentsAsaas.generatePixCharge.mutate({
  matchId: 'match-123',
  playerId: 'player-456',
  amount: '130.00',
  description: 'Partida + churrasco',
  daysUntilDue: 3  // Vencimento em 3 dias
});
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "asaasChargeId": "string",
    "amount": "130.00",
    "pixQrCode": "base64",
    "pixCopiaeCola": "string",
    "dueDate": "2024-02-15",
    "status": "PENDING"
  }
}
```

### Obter Status de Pagamento

```typescript
const status = await trpc.paymentsAsaas.getPaymentStatus.query({
  paymentId: 'payment-uuid'
});
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "CONFIRMED",
    "amount": "130.00",
    "pixQrCode": "base64",
    "pixCopiaeCola": "string",
    "confirmedAt": "2024-02-12T10:30:00Z",
    "receivedAt": null
  }
}
```

### Listar Pagamentos da Partida

```typescript
const payments = await trpc.paymentsAsaas.listMatchPayments.query({
  matchId: 'match-123'
});
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "payments": [...],
    "summary": {
      "total": 10,
      "pending": 3,
      "confirmed": 5,
      "received": 2,
      "failed": 0,
      "totalAmount": 1300.00
    }
  }
}
```

### Listar Pagamentos do Jogador

```typescript
const payments = await trpc.paymentsAsaas.listPlayerPayments.query({
  playerId: 'player-456'
});
```

### Cancelar Pagamento

```typescript
const result = await trpc.paymentsAsaas.cancelPayment.mutate({
  paymentId: 'payment-uuid'
});
```

### Obter Resumo do Grupo

```typescript
const summary = await trpc.paymentsAsaas.getGroupPaymentsSummary.query();
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "pending": 10,
    "confirmed": 20,
    "received": 18,
    "failed": 2,
    "totalAmount": 6500.00,
    "receivedAmount": 2340.00
  }
}
```

## 🪝 Webhook Handler

### Configurar Webhook na Asaas

1. Acesse **Configurações > Webhooks**
2. Adicione URL: `https://seu-dominio.com/webhooks/asaas`
3. Selecione eventos:
   - `payment.confirmed` - Pagamento confirmado
   - `payment.received` - Pagamento recebido
   - `payment.failed` - Pagamento falhou
   - `payment.cancelled` - Pagamento cancelado

### Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `payment.confirmed` | PIX confirmado pelo banco | Atualizar status para CONFIRMED |
| `payment.received` | Dinheiro recebido na conta | Atualizar status para RECEIVED |
| `payment.failed` | Pagamento falhou | Atualizar status para FAILED |
| `payment.cancelled` | Pagamento cancelado | Atualizar status para CANCELLED |

### Validação de Webhook

Todos os webhooks incluem assinatura HMAC-SHA256 no header `X-Asaas-Webhook-Signature`:

```typescript
// Validar assinatura
const isValid = asaasService.validateWebhookSignature(
  JSON.stringify(payload),
  signature,
  WEBHOOK_SECRET
);

if (!isValid) {
  console.warn('Webhook com assinatura inválida');
}
```

## 💾 Banco de Dados

### Tabela: asaas_payments

```sql
CREATE TABLE asaas_payments (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL,
  match_id UUID NOT NULL,
  player_id UUID NOT NULL,
  
  -- Dados da cobrança
  asaas_charge_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  
  -- Status
  status TEXT DEFAULT 'PENDING',
  pix_qr_code TEXT,
  pix_copia_e_cola TEXT,
  pix_expiration_date TIMESTAMP,
  
  -- Confirmação
  confirmed_at TIMESTAMP,
  received_at TIMESTAMP,
  failed_at TIMESTAMP,
  failure_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Tabela: asaas_customers

```sql
CREATE TABLE asaas_customers (
  id UUID PRIMARY KEY,
  group_id UUID NOT NULL,
  player_id UUID NOT NULL,
  
  asaas_customer_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cpf_cnpj TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: webhook_logs

```sql
CREATE TABLE webhook_logs (
  id UUID PRIMARY KEY,
  group_id UUID,
  asaas_charge_id TEXT,
  
  event TEXT NOT NULL,
  payload TEXT NOT NULL,
  signature TEXT,
  
  is_valid BOOLEAN DEFAULT TRUE,
  processed_at TIMESTAMP DEFAULT NOW(),
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testes

### Executar Testes

```bash
npm test -- asaas-service.test.ts
```

### Cobertura

- ✅ Formatação de valores
- ✅ Cálculo de datas
- ✅ Validação de webhook signature
- ✅ Processamento de eventos
- ✅ Geração de QR Code
- ✅ Tratamento de erros

## 🔐 Segurança

### Validação de Acesso

Todos os endpoints validam:
- ✅ Autenticação JWT
- ✅ Acesso ao grupo (group_id)
- ✅ Acesso à partida (match_id)
- ✅ Acesso ao jogador (player_id)

### Validação de Webhook

- ✅ Assinatura HMAC-SHA256
- ✅ Timestamp de processamento
- ✅ Auditoria em webhook_logs
- ✅ Soft delete para histórico

## 🚀 Deployment

### Variáveis Obrigatórias

```bash
ASAAS_API_KEY=your_production_api_key
ASAAS_ENVIRONMENT=production
ASAAS_WEBHOOK_SECRET=your_webhook_secret
WEBHOOK_URL=https://seu-dominio.com
```

### Health Check

```bash
curl https://seu-dominio.com/webhooks/asaas/health
```

## 📊 Monitoramento

### Logs de Webhook

```sql
SELECT * FROM webhook_logs 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Status de Pagamentos

```sql
SELECT 
  status,
  COUNT(*) as total,
  SUM(amount) as total_amount
FROM asaas_payments
WHERE group_id = 'group-uuid'
GROUP BY status;
```

## 🐛 Troubleshooting

### Webhook não é recebido

1. Verificar URL pública está acessível
2. Verificar firewall permite POST em /webhooks/asaas
3. Verificar logs em webhook_logs
4. Testar webhook manualmente na dashboard Asaas

### Pagamento não confirma

1. Verificar se PIX foi realmente enviado
2. Verificar status em asaas_payments
3. Consultar Asaas API manualmente: `GET /payments/{chargeId}`
4. Verificar webhook_logs para erros

### Erro de Assinatura

1. Verificar ASAAS_WEBHOOK_SECRET está correto
2. Verificar payload não foi modificado
3. Verificar header X-Asaas-Webhook-Signature

## 📚 Referências

- [Documentação Asaas](https://docs.asaas.com)
- [API Reference](https://docs.asaas.com/reference/api-overview)
- [Webhook Documentation](https://docs.asaas.com/docs/webhooks)
- [PIX Documentation](https://docs.asaas.com/docs/pix)

## 🔄 Fluxo Completo (Exemplo)

```typescript
// 1. Admin cria partida
const match = await createMatch({
  sport: 'futebol',
  date: '2024-02-15',
  location: 'Parque Central',
  costPerPlayer: 80,
  extras: [
    { name: 'Churrasco', cost: 500 }
  ]
});

// 2. Sistema calcula custo total
// 10 jogadores × (R$ 80 + R$ 50) = R$ 1.300

// 3. Gerar cobranças PIX
for (const player of match.players) {
  const payment = await generatePixCharge({
    matchId: match.id,
    playerId: player.id,
    amount: '130.00',
    description: 'Partida + churrasco'
  });
  
  // Enviar QR Code para jogador via WhatsApp
  await sendWhatsAppMessage(player.phone, {
    text: `Escaneie o QR Code para pagar R$ 130`,
    image: payment.pixQrCode
  });
}

// 4. Jogador escaneia e paga
// (Acontece no app do banco)

// 5. Webhook confirma
// POST /webhooks/asaas
// {
//   "event": "payment.confirmed",
//   "data": { "id": "charge-123", "status": "CONFIRMED" }
// }

// 6. Status atualizado automaticamente
// Admin vê: "8/10 pagamentos confirmados"
// Jogador vê: "Pagamento confirmado ✅"
```

## 📝 Notas

- QR Codes PIX expiram em 24 horas por padrão
- Asaas cobra taxa de 2,99% + R$ 0,30 por transação
- Sandbox usa dados fictícios (não gera PIX real)
- Webhooks são reenviados até 5 vezes em caso de falha
- Manter ASAAS_WEBHOOK_SECRET em segredo (usar variáveis de ambiente)
