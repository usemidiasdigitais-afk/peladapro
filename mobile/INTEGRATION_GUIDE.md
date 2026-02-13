# Guia de Integração Completa - Pelada Pró

Documentação da integração de todos os componentes do sistema.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Fluxos Principais](#fluxos-principais)
4. [Integração de Componentes](#integração-de-componentes)
5. [Testes End-to-End](#testes-end-to-end)
6. [Deployment](#deployment)

## 🎯 Visão Geral

O Pelada Pró é um sistema completo de gestão de esportes amadores com:

- ✅ **App Mobile** (Expo) - Interface principal
- ✅ **Painel Admin Web** (Next.js) - Gerenciamento
- ✅ **Backend API** (Node.js + Express) - Lógica de negócio
- ✅ **Database** (PostgreSQL) - Armazenamento de dados
- ✅ **Pagamentos** (Asaas) - PIX e Boletos
- ✅ **IA** (Sorteio Preditivo) - Análise de jogadores

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     Cliente (Mobile + Web)                   │
├─────────────────────────────────────────────────────────────┤
│  App Expo (Mobile)          │    Painel Next.js (Web)        │
│  ├── Login/Signup           │    ├── Dashboard               │
│  ├── Dashboard              │    ├── Gerenciar Grupos        │
│  ├── Partidas               │    ├── Gerenciar Jogadores     │
│  ├── Sorteio IA             │    ├── Relatórios              │
│  ├── Churrasco              │    └── Configurações           │
│  └── Pagamentos             │                                 │
├─────────────────────────────────────────────────────────────┤
│                    SecureAPIClient (HTTP)                    │
│              (Validação de group_id + JWT)                   │
├─────────────────────────────────────────────────────────────┤
│                      Backend API (Node.js)                   │
│  ├── /auth (Login, Signup, Refresh)                          │
│  ├── /groups (CRUD de grupos)                                │
│  ├── /matches (CRUD de partidas)                             │
│  ├── /players (CRUD de jogadores)                            │
│  ├── /payments (Integração Asaas)                            │
│  ├── /sorter (IA para sorteio)                               │
│  ├── /barbecue (Controle de despesas)                        │
│  └── /webhooks (Asaas, eventos)                              │
├─────────────────────────────────────────────────────────────┤
│                    PostgreSQL Database                       │
│  ├── users (Usuários)                                        │
│  ├── groups (Grupos)                                         │
│  ├── matches (Partidas)                                      │
│  ├── players (Jogadores)                                     │
│  ├── payments (Pagamentos)                                   │
│  ├── barbecue_expenses (Despesas)                            │
│  └── audit_logs (Auditoria)                                  │
├─────────────────────────────────────────────────────────────┤
│                   Serviços Externos                          │
│  ├── Asaas (Pagamentos PIX/Boleto)                           │
│  └── IA (Análise de jogadores)                               │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxos Principais

### 1. Fluxo de Login

```
Usuário abre app
    ↓
Tela de Login
    ↓
Insere email e senha
    ↓
Clica em "Entrar"
    ↓
SecureAuthContext.login()
    ↓
SecureAPIClient POST /auth/login
    ↓
Backend valida credenciais
    ↓
Backend gera JWT token
    ↓
App salva user + token em AsyncStorage
    ↓
App redireciona para Dashboard
```

### 2. Fluxo de Criação de Partida

```
Usuário clica em "Criar Partida"
    ↓
Preenche formulário (data, hora, local, etc)
    ↓
Clica em "Criar"
    ↓
SecureAPIClient POST /matches
    ↓
Middleware valida:
  - Autenticação (JWT)
  - Autorização (role)
  - Multi-tenancy (group_id)
    ↓
Backend cria partida no banco
    ↓
Backend retorna partida criada
    ↓
App atualiza lista de partidas
    ↓
Usuário vê partida na lista
```

### 3. Fluxo de Sorteio de Times

```
Usuário clica em "Gerar Times"
    ↓
App carrega lista de jogadores confirmados
    ↓
SecureAPIClient POST /sorter/generate
    ↓
Backend executa AISorterService
    ↓
IA analisa:
  - Rating de cada jogador
  - Experiência
  - Desempenho
  - Compatibilidade
    ↓
IA gera múltiplas opções de sorteio
    ↓
IA calcula balanceamento de cada opção
    ↓
Backend retorna opções ordenadas
    ↓
App exibe opções com análise
    ↓
Usuário seleciona melhor opção
    ↓
App salva times confirmados
```

### 4. Fluxo de Pagamento PIX

```
Usuário clica em "Pagar"
    ↓
Seleciona método (PIX ou Boleto)
    ↓
App mostra modal de pagamento
    ↓
SecureAPIClient POST /payments/create
    ↓
Backend chama AsaasService.createCharge()
    ↓
Asaas gera cobrança PIX
    ↓
Asaas retorna QR Code
    ↓
Backend salva payment no banco
    ↓
App exibe QR Code + chave PIX
    ↓
Usuário escaneia com seu banco
    ↓
Transferência é realizada
    ↓
Asaas envia webhook confirmando pagamento
    ↓
Backend atualiza status do payment
    ↓
App recebe notificação
    ↓
App exibe "Pagamento confirmado"
```

### 5. Fluxo de Controle de Churrasco

```
Usuário clica em "Churrasco"
    ↓
Tela exibe resumo de despesas
    ↓
Usuário clica em "+ Adicionar"
    ↓
Modal abre com formulário
    ↓
Usuário preenche:
  - Categoria (Carnes, Bebidas, etc)
  - Descrição
  - Valor
  - Quem pagou
  - Dividir entre quantos
    ↓
Clica em "Adicionar"
    ↓
BarbecueService.addExpense()
    ↓
Despesa é salva localmente
    ↓
BarbecueService.calculateDebts()
    ↓
Sistema calcula quem deve a quem
    ↓
App atualiza resumo
    ↓
Usuário vê débitos pendentes
    ↓
Usuário clica em "✓ Pago"
    ↓
Débito é marcado como pago
```

## 🔌 Integração de Componentes

### 1. SecureAuthContext + SecureAPIClient

```typescript
// App.tsx
import { SecureAuthProvider } from '@/contexts/SecureAuthContext';

export default function App() {
  return (
    <SecureAuthProvider>
      <RootNavigator />
    </SecureAuthProvider>
  );
}

// Em qualquer tela
import { useSecureAuth } from '@/contexts/SecureAuthContext';
import { getSecureAPIClient } from '@/services/secure-api-client';

export default function MatchesScreen() {
  const { user, isAuthenticated } = useSecureAuth();
  const apiClient = getSecureAPIClient();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Buscar partidas do grupo do usuário
      const matches = await apiClient.get('/api/matches', {
        groupId: user.groupId,
      });
    }
  }, [isAuthenticated, user]);
}
```

### 2. AISorterService + SecureAPIClient

```typescript
// Tela de Sorteio
import { initBarbecueService } from '@/services/ai-sorter-service';
import { getSecureAPIClient } from '@/services/secure-api-client';

export default function SorterScreen() {
  const { user } = useSecureAuth();
  const apiClient = getSecureAPIClient();
  const sorterService = initAISorterService();

  const handleGenerateSorter = async () => {
    // Buscar jogadores confirmados
    const players = await apiClient.get('/api/matches/match-1/players', {
      groupId: user.groupId,
    });

    // Gerar sorteio com IA
    const sorters = sorterService.generateMultipleSorters(players, 3);

    // Exibir opções
    setSorters(sorters);
  };
}
```

### 3. BarbecueService + SecureAPIClient

```typescript
// Tela de Churrasco
import { initBarbecueService } from '@/services/barbecue-service';
import { getSecureAPIClient } from '@/services/secure-api-client';

export default function BarbecueScreen() {
  const { user } = useSecureAuth();
  const apiClient = getSecureAPIClient();
  const barbecueService = initBarbecueService();

  const handleAddExpense = async (expense) => {
    // Adicionar despesa localmente
    barbecueService.addExpense(expense);

    // Salvar no backend
    await apiClient.post('/api/barbecue/expenses', expense, {
      groupId: user.groupId,
    });

    // Calcular débitos
    const summary = barbecueService.generateSummary(matchId);
    setSummary(summary);
  };
}
```

### 4. AsaasService + SecureAPIClient

```typescript
// Tela de Pagamento
import { initAsaasService } from '@/services/asaas-service';
import { getSecureAPIClient } from '@/services/secure-api-client';

export default function PaymentScreen() {
  const { user } = useSecureAuth();
  const apiClient = getSecureAPIClient();
  const asaasService = initAsaasService();

  const handlePaymentPIX = async (amount) => {
    // Criar cobrança no backend
    const charge = await apiClient.post(
      '/api/payments/create',
      { amount, method: 'PIX' },
      { groupId: user.groupId }
    );

    // Gerar QR Code
    const qrCode = await asaasService.generatePixQrCode(charge.id);

    // Exibir QR Code
    setQrCode(qrCode);
  };
}
```

## 🧪 Testes End-to-End

### Teste 1: Login → Dashboard

```typescript
describe('E2E: Login → Dashboard', () => {
  it('deve fazer login e exibir dashboard', async () => {
    // 1. Ir para tela de login
    await screen.findByText('Entrar');

    // 2. Preencher formulário
    await userEvent.typeText(emailInput, 'user@example.com');
    await userEvent.typeText(passwordInput, 'password123');

    // 3. Clicar em "Entrar"
    await userEvent.press(loginButton);

    // 4. Aguardar redirecionamento
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeOnTheScreen();
    });

    // 5. Verificar que dados foram carregados
    expect(screen.getByText('Partidas')).toBeOnTheScreen();
  });
});
```

### Teste 2: Criar Partida → Sorteio → Pagamento

```typescript
describe('E2E: Criar Partida → Sorteio → Pagamento', () => {
  it('deve criar partida, gerar sorteio e processar pagamento', async () => {
    // 1. Criar partida
    await userEvent.press(screen.getByText('Criar Partida'));
    await userEvent.typeText(nameInput, 'Pelada do Domingo');
    await userEvent.press(createButton);

    // 2. Gerar sorteio
    await userEvent.press(screen.getByText('Gerar Times'));
    await waitFor(() => {
      expect(screen.getByText(/Times gerados/)).toBeOnTheScreen();
    });

    // 3. Confirmar sorteio
    await userEvent.press(screen.getByText('Confirmar'));

    // 4. Ir para pagamento
    await userEvent.press(screen.getByText('Pagar'));

    // 5. Selecionar PIX
    await userEvent.press(screen.getByText('PIX'));

    // 6. Exibir QR Code
    await waitFor(() => {
      expect(screen.getByTestId('qr-code')).toBeOnTheScreen();
    });
  });
});
```

### Teste 3: Controle de Churrasco

```typescript
describe('E2E: Controle de Churrasco', () => {
  it('deve adicionar despesas e calcular débitos', async () => {
    // 1. Ir para churrasco
    await userEvent.press(screen.getByText('Churrasco'));

    // 2. Adicionar primeira despesa
    await userEvent.press(screen.getByText('+ Adicionar'));
    await userEvent.press(screen.getByText('🥩 Carnes'));
    await userEvent.typeText(descriptionInput, 'Carne vermelha 5kg');
    await userEvent.typeText(amountInput, '150');
    await userEvent.press(addButton);

    // 3. Adicionar segunda despesa
    await userEvent.press(screen.getByText('+ Adicionar'));
    await userEvent.press(screen.getByText('🍺 Bebidas'));
    await userEvent.typeText(descriptionInput, 'Cerveja 2 caixas');
    await userEvent.typeText(amountInput, '100');
    await userEvent.press(addButton);

    // 4. Ver resumo
    await userEvent.press(screen.getByText('Ver Resumo'));

    // 5. Verificar débitos
    await waitFor(() => {
      expect(screen.getByText(/deve.*a/)).toBeOnTheScreen();
    });
  });
});
```

## 🚀 Deployment

### Pré-requisitos

```bash
# Node.js 18+
node --version

# npm ou pnpm
npm --version

# Expo CLI
npm install -g expo-cli

# Git
git --version
```

### Variáveis de Ambiente

```bash
# .env.local
EXPO_PUBLIC_API_URL=https://api.peladapro.com
EXPO_PUBLIC_ASAAS_API_KEY=your_asaas_key
EXPO_PUBLIC_ASAAS_ENVIRONMENT=production
EXPO_PUBLIC_WEBHOOK_SECRET=your_webhook_secret
```

### Build para iOS

```bash
# Gerar certificado
eas credentials

# Build
eas build --platform ios

# Publicar na App Store
eas submit --platform ios
```

### Build para Android

```bash
# Gerar keystore
eas credentials

# Build
eas build --platform android

# Publicar na Google Play
eas submit --platform android
```

### Deploy do Backend

```bash
# Fazer build
npm run build

# Fazer deploy (Heroku)
git push heroku main

# Ou (AWS)
eb deploy
```

## 📊 Checklist de Integração

- [ ] SecureAuthContext integrado
- [ ] SecureAPIClient integrado
- [ ] AISorterService integrado
- [ ] BarbecueService integrado
- [ ] AsaasService integrado
- [ ] Todas as telas criadas
- [ ] Todos os endpoints funcionando
- [ ] Testes passando
- [ ] Documentação completa
- [ ] Pronto para produção

## 🎯 Próximos Passos

1. **Semana 1**: Deploy em staging
2. **Semana 2**: Testes de carga
3. **Semana 3**: Testes de penetração
4. **Semana 4**: Deploy em produção
5. **Mês 2-3**: Novas features (App web, Visão computacional)

---

**Pelada Pró - Sistema Completo Integrado** ✅
