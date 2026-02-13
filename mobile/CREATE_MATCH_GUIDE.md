# Guia de Criação de Peladas - Pelada Pró

## Visão Geral

O Pelada Pró permite que **admins de grupos criem peladas** com configuração completa de:
- 📍 Local com Google Places
- 📅 Data e hora
- 👥 Vagas (jogadores + goleiros)
- 💰 Financeiro integrado
- 🔗 Link mágico de convite
- 📤 Compartilhamento (WhatsApp, SMS, Email)

---

## Fluxo de Criação

```
┌──────────────────────────────────────────────────────┐
│ 1. Admin clica "Organizar Nova Pelada"               │
│    - Abre formulário de criação                      │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 2. Preencher Informações                             │
│    - Título                                          │
│    - Local (com Google Places)                       │
│    - Data e Hora                                     │
│    - Vagas (Jogadores + Goleiros)                    │
│    - Financeiro (opcional)                           │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 3. Salvar Pelada                                     │
│    - Validar dados                                   │
│    - Salvar com group_id                             │
│    - Gerar link de convite                           │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 4. Compartilhar Convite                              │
│    - WhatsApp                                        │
│    - SMS                                             │
│    - Email                                           │
│    - Copiar link                                     │
└──────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│ 5. Jogadores Confirmam                               │
│    - Clicam no link de convite                       │
│    - Confirmam presença                              │
│    - Pagam (se obrigatório)                          │
└──────────────────────────────────────────────────────┘
```

---

## Campos do Formulário

### Título da Pelada
- **Obrigatório**: Sim
- **Tipo**: Texto
- **Exemplo**: "Pelada de Quinta à Noite"
- **Limite**: 100 caracteres

### Local da Quadra
- **Obrigatório**: Sim
- **Tipo**: Google Places (Autocomplete)
- **Dados**: Endereço, Latitude, Longitude, Place ID
- **Exemplo**: "Quadra Central - Rua A, 123"

### Data e Hora
- **Obrigatório**: Sim
- **Tipo**: DateTime Picker
- **Formato**: DD/MM/YYYY HH:MM
- **Validação**: Não pode ser no passado

### Vagas - Jogadores
- **Obrigatório**: Sim
- **Tipo**: Número
- **Padrão**: 11
- **Intervalo**: 2-22
- **Descrição**: Número máximo de jogadores

### Vagas - Goleiros
- **Obrigatório**: Sim
- **Tipo**: Número
- **Padrão**: 2
- **Intervalo**: 1-4
- **Descrição**: Número máximo de goleiros

### Ativar Financeiro
- **Obrigatório**: Não
- **Tipo**: Toggle
- **Padrão**: Desativado
- **Descrição**: Habilita configuração de pagamentos

### Valor da Pelada (se Financeiro Ativado)
- **Obrigatório**: Sim (se financeiro ativado)
- **Tipo**: Decimal
- **Formato**: R$ 00.00
- **Exemplo**: 50.00

### Rateio de Churrasco (se Financeiro Ativado)
- **Obrigatório**: Não
- **Tipo**: Toggle
- **Padrão**: Desativado
- **Descrição**: Ativa módulo de churrasco

### Pagamento Obrigatório (se Financeiro Ativado)
- **Obrigatório**: Não
- **Tipo**: Toggle
- **Padrão**: Desativado
- **Descrição**: Requer pagamento PIX para confirmar

---

## Implementação

### Serviço de Peladas

```typescript
import { getMatchService } from '@/services/match-service';

const matchService = getMatchService();

// Criar pelada
const newMatch = await matchService.createMatch({
  groupId: 'group-1',
  title: 'Pelada de Quinta',
  location: {
    address: 'Quadra Central - Rua A, 123',
    latitude: -23.5505,
    longitude: -46.6333,
    placeId: 'place_abc123',
  },
  dateTime: '2024-02-15T19:00:00Z',
  maxPlayers: 11,
  maxGoalkeepers: 2,
  financialConfig: {
    enabled: true,
    amount: 5000, // R$ 50.00 em centavos
    splitBarbecue: true,
    paymentRequired: true,
  },
});

// Gerar link de convite
const inviteLink = await matchService.generateInviteLink(newMatch.id, 'group-1');

// Gerar link WhatsApp
const whatsappLink = matchService.generateWhatsAppLink(
  inviteLink.link,
  'Pelada de Quinta'
);
```

### Tela de Criação

```typescript
import CreateMatchScreen from '@/app/create-match';

// Usar na navegação
<Stack.Screen
  name="create-match"
  component={CreateMatchScreen}
  options={{
    title: 'Organizar Nova Pelada',
  }}
/>

// Navegar
navigation.navigate('create-match');
```

### Tela de Compartilhamento

```typescript
import ShareMatchScreen from '@/app/share-match';

// Usar na navegação
<Stack.Screen
  name="share-match"
  component={ShareMatchScreen}
  options={{
    title: 'Compartilhar Pelada',
  }}
/>

// Navegar
navigation.navigate('share-match', {
  matchId: 'match-1',
  inviteLink: 'https://peladapro.com/invite/token-abc123',
  matchTitle: 'Pelada de Quinta',
});
```

---

## Isolamento por Grupo

### Validação em 3 Camadas

**1. Frontend**
```typescript
const { getCurrentGroupId } = useMultiTenancy();
const groupId = getCurrentGroupId();

// Validar antes de criar
if (!groupId) throw new Error('Grupo não identificado');
```

**2. API Client**
```typescript
const api = getSecureAPIClient();

// Automaticamente adiciona X-Group-ID header
await api.post('/matches', {
  groupId, // Validado
  title: 'Pelada',
});
```

**3. Backend**
```typescript
// Middleware valida
if (req.headers['x-group-id'] !== req.user.groupId) {
  return res.status(403).json({ error: 'Access denied' });
}

// Query filtra por group_id
const matches = await db.query.matches.findMany({
  where: (matches, { eq }) => eq(matches.groupId, req.groupId),
});
```

### Garantias

- ✅ Admin1 **NÃO** consegue ver peladas de Admin2
- ✅ Dados de peladas isolados por grupo
- ✅ Links de convite validados com group_id
- ✅ Relatórios específicos por grupo

---

## Link Mágico de Convite

### Características

- **Único**: Cada pelada tem um link único
- **Seguro**: Token criptografado
- **Válido**: 30 dias após criação
- **Rastreável**: Auditoria de uso

### Formato

```
https://peladapro.com/invite/{token}
```

### Exemplo de Token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJtYXRjaElkIjoibWF0Y2gtMSIsImdyb3VwSWQiOiJncm91cC0xIiwiaWF0IjoxNzA3OTAwMDAwLCJleHAiOjE3MTA0OTIwMDB9.abc123xyz789
```

---

## Compartilhamento

### WhatsApp

```typescript
const whatsappLink = matchService.generateWhatsAppLink(
  'https://peladapro.com/invite/token-abc123',
  'Pelada de Quinta'
);

// Abre WhatsApp com mensagem pré-preenchida
Linking.openURL(whatsappLink);
```

**Mensagem Enviada:**
```
🏆 Vem jogar comigo!

Pelada: Pelada de Quinta

Clique aqui para confirmar sua presença:
https://peladapro.com/invite/token-abc123

#PeladaPró
```

### SMS

```typescript
const smsLink = matchService.generateSMSLink(
  'https://peladapro.com/invite/token-abc123',
  'Pelada de Quinta'
);

// Abre SMS com mensagem pré-preenchida
Linking.openURL(smsLink);
```

**Mensagem Enviada:**
```
Vem jogar comigo! Pelada: Pelada de Quinta
https://peladapro.com/invite/token-abc123
```

### Email

```typescript
const emailLink = matchService.generateEmailLink(
  'https://peladapro.com/invite/token-abc123',
  'Pelada de Quinta'
);

// Abre Email com assunto e corpo pré-preenchidos
Linking.openURL(emailLink);
```

**Email Enviado:**
```
Assunto: Convite para Pelada: Pelada de Quinta

Corpo:
Oi!

Vem jogar comigo!

Pelada: Pelada de Quinta

Clique aqui para confirmar sua presença:
https://peladapro.com/invite/token-abc123

Abraços!
```

---

## Segurança

### Validações

- ✅ Título não vazio
- ✅ Local selecionado
- ✅ Data/hora no futuro
- ✅ Vagas válidas
- ✅ Isolamento por group_id
- ✅ Validação de acesso

### Boas Práticas

1. **Nunca exponha group_id** no link de convite
2. **Sempre valide group_id** antes de criar
3. **Registre todas as ações** em auditoria
4. **Use HTTPS** para compartilhamento
5. **Teste em Sandbox** antes de produção

---

## Testes

### Testes de Segurança

```bash
npm test -- create-match-security.test.ts
```

Testes cobrem:
- ✅ Isolamento de peladas
- ✅ Validação de links de convite
- ✅ Proteção de dados financeiros
- ✅ Validação de requisições
- ✅ Compartilhamento seguro
- ✅ Auditoria de ações
- ✅ Rate limiting

### Teste Manual

1. Clique em "Organizar Nova Pelada"
2. Preencha todos os campos
3. Clique em "Criar Pelada"
4. Compartilhe via WhatsApp
5. Valide que o link funciona

---

## Troubleshooting

### Erro: "Grupo não identificado"

**Causa**: Usuário não está autenticado

**Solução**:
1. Faça login novamente
2. Verifique se está em um grupo

### Erro: "Local não encontrado"

**Causa**: Google Places não retornou resultado

**Solução**:
1. Verifique a digitação
2. Tente outro endereço
3. Use coordenadas GPS

### Erro: "Data no passado"

**Causa**: Data/hora selecionada é anterior a agora

**Solução**:
1. Selecione uma data futura
2. Verifique o fuso horário

### Link de convite não funciona

**Causa**: Token expirado ou inválido

**Solução**:
1. Gere um novo link
2. Compartilhe novamente

---

## Exemplo Completo

```typescript
// 1. Criar pelada
const newMatch = await matchService.createMatch({
  groupId: 'group-1',
  title: 'Pelada de Quinta',
  location: {
    address: 'Quadra Central - Rua A, 123',
    latitude: -23.5505,
    longitude: -46.6333,
    placeId: 'place_abc123',
  },
  dateTime: '2024-02-15T19:00:00Z',
  maxPlayers: 11,
  maxGoalkeepers: 2,
  financialConfig: {
    enabled: true,
    amount: 5000,
    splitBarbecue: true,
    paymentRequired: true,
  },
});

// 2. Gerar link de convite
const inviteLink = await matchService.generateInviteLink(newMatch.id, 'group-1');

// 3. Compartilhar via WhatsApp
const whatsappLink = matchService.generateWhatsAppLink(
  inviteLink.link,
  'Pelada de Quinta'
);
Linking.openURL(whatsappLink);

// 4. Jogador clica no link e confirma
// 5. Sistema valida group_id
// 6. Jogador aparece na lista
// 7. Se pagamento obrigatório, redireciona para PIX
```

---

## Conclusão

O Pelada Pró oferece **criação de peladas segura e isolada por grupo**:

✅ Formulário completo  
✅ Isolamento total de dados  
✅ Link mágico de convite  
✅ Compartilhamento fácil  
✅ Auditoria completa  
✅ Pronto para produção  

Comece a organizar suas peladas agora! 🚀
