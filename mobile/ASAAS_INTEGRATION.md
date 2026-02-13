# Integração Asaas - Pelada Pró

Documentação completa da integração com a API Asaas para pagamentos PIX e Boletos.

## 📋 Índice

1. [Configuração](#configuração)
2. [Serviço Asaas](#serviço-asaas)
3. [Tela de Pagamento](#tela-de-pagamento)
4. [Fluxo de Pagamento](#fluxo-de-pagamento)
5. [Webhooks](#webhooks)
6. [Exemplos de Uso](#exemplos-de-uso)

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# .env
ASAAS_API_KEY=your_asaas_api_key
ASAAS_ENVIRONMENT=sandbox  # ou 'production'
```

### Inicializar Serviço

```typescript
import { initAsaasService } from '@/services/asaas-service';

const asaasService = initAsaasService();
```

## 🛠️ Serviço Asaas

### Classe: AsaasService

Serviço completo para integração com Asaas.

#### Métodos Disponíveis

**1. Criar Cliente**

```typescript
const customer = await asaasService.createCustomer({
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  cpfCnpj: '12345678901',
});
```

**2. Criar Cobrança (PIX)**

```typescript
const charge = await asaasService.createCharge({
  customer: 'customer-id',
  billingType: 'PIX',
  value: 50.00,
  dueDate: '2024-02-20',
  description: 'Pagamento - Partida do Domingo',
});

// Resposta
{
  id: 'charge-123',
  status: 'PENDING',
  billingType: 'PIX',
  value: 50.00,
  pixQrCode: 'base64-encoded-image',
  pixCopiaeCola: '00020126580014...',
  createdAt: '2024-02-12T10:30:00Z'
}
```

**3. Criar Cobrança (Boleto)**

```typescript
const charge = await asaasService.createCharge({
  customer: 'customer-id',
  billingType: 'BOLETO',
  value: 50.00,
  dueDate: '2024-02-20',
  description: 'Pagamento - Partida do Domingo',
});

// Resposta
{
  id: 'charge-456',
  status: 'PENDING',
  billingType: 'BOLETO',
  value: 50.00,
  boletoBarCode: '12345.67890 12345.678901 12345.678901 1 12345678901234',
  boletoDigitableLine: '12345.67890 12345.678901 12345.678901 1 12345678901234',
  createdAt: '2024-02-12T10:30:00Z'
}
```

**4. Obter Cobrança**

```typescript
const charge = await asaasService.getCharge('charge-123');
```

**5. Listar Cobranças**

```typescript
const charges = await asaasService.listCharges('customer-id', 10);
```

**6. Cancelar Cobrança**

```typescript
await asaasService.cancelCharge('charge-123');
```

**7. Gerar QR Code PIX**

```typescript
const qrCode = await asaasService.generatePixQrCode('charge-123');
```

**8. Obter Chave PIX (Copia e Cola)**

```typescript
const copiaeCola = await asaasService.getPixCopiaeCola('charge-123');
```

**9. Obter Código de Barras Boleto**

```typescript
const barCode = await asaasService.getBoletoBarCode('charge-456');
```

**10. Validar Assinatura de Webhook**

```typescript
const isValid = asaasService.validateWebhookSignature(
  body,
  signature,
  webhookSecret
);
```

**11. Processar Webhook**

```typescript
const event = asaasService.processPaymentWebhook(webhookData);

// Retorna
{
  type: 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED',
  chargeId: 'charge-123',
  status: 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'DELETED',
  paidDate?: '2024-02-12T10:30:00Z',
  paidValue?: 50.00
}
```

## 📱 Tela de Pagamento

### Arquivo: `app/payment-options.tsx`

Tela interativa para escolher forma de pagamento (PIX ou Boleto).

#### Funcionalidades

- ✅ Seleção de método de pagamento
- ✅ Exibição de vantagens de cada método
- ✅ Geração de QR Code PIX
- ✅ Geração de Boleto
- ✅ Cópia de chave PIX
- ✅ Cópia de código de barras
- ✅ Instruções passo a passo
- ✅ Download de boleto em PDF

#### Uso

```typescript
import PaymentOptionsScreen from '@/app/payment-options';

// Navegar para tela
router.push({
  pathname: '/payment-options',
  params: {
    matchId: 'match-123',
    amount: '50.00',
  },
});
```

## 🔄 Fluxo de Pagamento

### PIX

```
1. Usuário clica em "Pagar"
   ↓
2. Seleciona "PIX"
   ↓
3. Clica em "Gerar QR Code PIX"
   ↓
4. Backend cria cobrança no Asaas
   ↓
5. App exibe QR Code e chave PIX
   ↓
6. Usuário escaneia com seu banco
   ↓
7. Realiza transferência
   ↓
8. Asaas envia webhook confirmando
   ↓
9. Backend atualiza status
   ↓
10. App exibe confirmação
```

### Boleto

```
1. Usuário clica em "Pagar"
   ↓
2. Seleciona "Boleto"
   ↓
3. Clica em "Gerar Boleto"
   ↓
4. Backend cria cobrança no Asaas
   ↓
5. App exibe código de barras e linha digitável
   ↓
6. Usuário copia código e paga em seu banco
   ↓
7. Banco processa pagamento (até 3 dias úteis)
   ↓
8. Asaas envia webhook confirmando
   ↓
9. Backend atualiza status
   ↓
10. App exibe confirmação
```

## 🪝 Webhooks

### Eventos Suportados

| Evento | Descrição |
|--------|-----------|
| `payment_confirmed` | Pagamento confirmado (PIX) |
| `payment_received` | Pagamento recebido (Boleto) |
| `payment_overdue` | Pagamento vencido |
| `payment_deleted` | Pagamento cancelado |

### Configurar Webhook

1. Acesse [Asaas Dashboard](https://app.asaas.com)
2. Vá para Configurações → Webhooks
3. Adicione URL: `https://seu-dominio.com/api/webhooks/asaas`
4. Selecione eventos a monitorar
5. Copie o secret para `.env`

### Exemplo de Payload

```json
{
  "event": "payment_confirmed",
  "payment": {
    "id": "charge-123",
    "status": "CONFIRMED",
    "billingType": "PIX",
    "value": 50.00,
    "confirmedDate": "2024-02-12T10:30:00Z"
  }
}
```

## 📚 Exemplos de Uso

### Exemplo 1: Criar Cliente e Cobrança PIX

```typescript
import { initAsaasService } from '@/services/asaas-service';

const asaasService = initAsaasService();

// Criar cliente
const customer = await asaasService.createCustomer({
  name: 'João Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
});

// Criar cobrança PIX
const charge = await asaasService.createCharge({
  customer: customer.id,
  billingType: 'PIX',
  value: 50.00,
  dueDate: asaasService.calculateDueDate(0), // Hoje
  description: 'Pagamento - Partida do Domingo',
});

// Obter QR Code
const qrCode = await asaasService.generatePixQrCode(charge.id);
const copiaeCola = await asaasService.getPixCopiaeCola(charge.id);

console.log('QR Code:', qrCode);
console.log('Copia e Cola:', copiaeCola);
```

### Exemplo 2: Criar Boleto com Vencimento em 3 Dias

```typescript
const charge = await asaasService.createCharge({
  customer: 'customer-id',
  billingType: 'BOLETO',
  value: 100.00,
  dueDate: asaasService.calculateDueDate(3), // 3 dias úteis
  description: 'Pagamento - Campeonato Amigos',
});

const barCode = await asaasService.getBoletoBarCode(charge.id);
const digitableLine = await asaasService.getBoletoDigitableLine(charge.id);

console.log('Código de Barras:', barCode);
console.log('Linha Digitável:', digitableLine);
```

### Exemplo 3: Processar Webhook

```typescript
// No backend (Express)
app.post('/api/webhooks/asaas', (req, res) => {
  const signature = req.headers['asaas-signature'];
  const body = JSON.stringify(req.body);

  // Validar assinatura
  const isValid = asaasService.validateWebhookSignature(
    body,
    signature,
    process.env.ASAAS_WEBHOOK_SECRET
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Processar evento
  const event = asaasService.processPaymentWebhook(req.body);

  switch (event.type) {
    case 'PAYMENT_CONFIRMED':
      // Atualizar status no banco de dados
      await updatePaymentStatus(event.chargeId, 'CONFIRMED');
      break;

    case 'PAYMENT_RECEIVED':
      // Atualizar status no banco de dados
      await updatePaymentStatus(event.chargeId, 'RECEIVED');
      break;

    case 'PAYMENT_OVERDUE':
      // Notificar usuário
      await notifyPaymentOverdue(event.chargeId);
      break;
  }

  res.json({ success: true });
});
```

## 🔒 Segurança

### Boas Práticas

1. **Nunca exponha a API Key**
   - Use variáveis de ambiente
   - Nunca commite `.env` no git

2. **Valide Webhooks**
   - Sempre valide a assinatura
   - Use HTTPS para webhooks

3. **Trate Erros**
   - Implemente retry logic
   - Log de erros para debugging

4. **Teste em Sandbox**
   - Use ambiente sandbox para testes
   - Migre para produção após validação

## 📞 Suporte

- [Documentação Asaas](https://docs.asaas.com)
- [API Reference](https://docs.asaas.com/reference)
- [Status Page](https://status.asaas.com)

## 📄 Licença

MIT License
