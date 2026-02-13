# Guia do Módulo de Churrasco - Pelada Pró

Documentação completa do sistema de gerenciamento de despesas de churrasco.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [API](#api)
4. [Exemplos de Uso](#exemplos-de-uso)
5. [Fluxo de Uso](#fluxo-de-uso)

## 🎯 Visão Geral

O módulo de churrasco permite que os organizadores de partidas controlem as despesas coletivas e calculem automaticamente quem deve a quem.

### Benefícios

- ✅ Controle total de despesas
- ✅ Divisão automática de custos
- ✅ Cálculo de débitos
- ✅ Relatórios detalhados
- ✅ Histórico completo

## 🎯 Funcionalidades

### 1. Adicionar Despesas

- ✅ Categorizar despesas (Carnes, Bebidas, Acompanhamentos, etc)
- ✅ Registrar quem pagou
- ✅ Dividir entre participantes
- ✅ Adicionar descrição e valor

### 2. Gerenciar Despesas

- ✅ Visualizar histórico
- ✅ Remover despesas
- ✅ Editar despesas
- ✅ Filtrar por categoria

### 3. Calcular Débitos

- ✅ Divisão automática de custos
- ✅ Cálculo de quem deve a quem
- ✅ Consolidação de débitos
- ✅ Marcação de pagamentos

### 4. Relatórios

- ✅ Resumo de despesas
- ✅ Balanço por participante
- ✅ Despesas por categoria
- ✅ Exportar como CSV

## 🔌 API

### Classe: BarbecueService

#### Método: addExpense()

```typescript
service.addExpense(expense: BarbecueExpense): void

Adiciona uma nova despesa ao churrasco.
```

#### Método: getExpenses()

```typescript
const expenses = service.getExpenses(matchId: string): BarbecueExpense[]

Retorna todas as despesas de um churrasco.
```

#### Método: removeExpense()

```typescript
service.removeExpense(matchId: string, expenseId: string): void

Remove uma despesa.
```

#### Método: calculateDebts()

```typescript
const debts = service.calculateDebts(matchId: string): BarbecueDebt[]

Calcula os débitos baseado nas despesas.
```

#### Método: generateSummary()

```typescript
const summary = service.generateSummary(matchId: string): BarbecueSummary

Gera um resumo completo do churrasco.
```

#### Método: generateReport()

```typescript
const report = service.generateReport(matchId: string): string

Gera um relatório textual formatado.
```

#### Método: exportAsCSV()

```typescript
const csv = service.exportAsCSV(matchId: string): string

Exporta despesas como CSV.
```

#### Método: formatCurrency()

```typescript
const formatted = service.formatCurrency(value: number): string

Formata valor em moeda brasileira.
```

#### Método: getCategories()

```typescript
const categories = service.getCategories(): Category[]

Retorna lista de categorias disponíveis.
```

### Interface: BarbecueExpense

```typescript
interface BarbecueExpense {
  id: string;
  matchId: string;
  category: 'MEAT' | 'DRINK' | 'SIDE_DISH' | 'ICE' | 'CHARCOAL' | 'OTHER';
  description: string;
  amount: number;
  paidBy: string; // ID do pagador
  paidByName: string;
  splitAmong: string[]; // IDs dos participantes
  date: string;
  receipt?: string; // URL da foto
}
```

### Interface: BarbecueDebt

```typescript
interface BarbecueDebt {
  from: string; // ID do devedor
  fromName: string;
  to: string; // ID do credor
  toName: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}
```

### Interface: BarbecueSummary

```typescript
interface BarbecueSummary {
  matchId: string;
  totalExpenses: number;
  expensesByCategory: { [key: string]: number };
  expenseCount: number;
  participantCount: number;
  averagePerPerson: number;
  debts: BarbecueDebt[];
  participants: Array<{
    id: string;
    name: string;
    paid: number;
    owes: number;
    balance: number;
  }>;
}
```

## 📚 Exemplos de Uso

### Exemplo 1: Adicionar Despesa

```typescript
import { initBarbecueService } from '@/services/barbecue-service';

const service = initBarbecueService();

const expense = {
  id: 'exp-1',
  matchId: 'match-123',
  category: 'MEAT',
  description: 'Carne vermelha - 5kg',
  amount: 150.00,
  paidBy: 'user-1',
  paidByName: 'João Silva',
  splitAmong: ['user-1', 'user-2', 'user-3'],
  date: new Date().toISOString(),
};

service.addExpense(expense);
```

### Exemplo 2: Calcular Débitos

```typescript
// Após adicionar várias despesas
const debts = service.calculateDebts('match-123');

for (const debt of debts) {
  if (!debt.isPaid) {
    console.log(
      `${debt.fromName} deve ${service.formatCurrency(debt.amount)} a ${debt.toName}`
    );
  }
}
```

### Exemplo 3: Gerar Resumo

```typescript
const summary = service.generateSummary('match-123');

console.log('Total Gasto:', service.formatCurrency(summary.totalExpenses));
console.log('Participantes:', summary.participantCount);
console.log('Média por Pessoa:', service.formatCurrency(summary.averagePerPerson));

// Balanço por participante
for (const participant of summary.participants) {
  console.log(`${participant.name}:`);
  console.log(`  Pagou: ${service.formatCurrency(participant.paid)}`);
  console.log(`  Deve: ${service.formatCurrency(participant.owes)}`);
  console.log(`  Balanço: ${service.formatCurrency(participant.balance)}`);
}
```

### Exemplo 4: Gerar Relatório

```typescript
const report = service.generateReport('match-123');
console.log(report);

// Saída:
// 📊 RELATÓRIO DE DESPESAS - CHURRASCO
// =====================================
//
// 💰 TOTAIS
// Total Gasto: R$ 500,00
// Número de Despesas: 5
// Participantes: 3
// Média por Pessoa: R$ 166,67
//
// 📋 DESPESAS POR CATEGORIA
// MEAT: R$ 250,00
// DRINK: R$ 150,00
// ICE: R$ 100,00
//
// 👥 BALANÇO POR PARTICIPANTE
// ✅ João Silva
//    Pagou: R$ 300,00
//    Deve: R$ 166,67
//    Balanço: R$ 133,33
//
// ❌ Maria Santos
//    Pagou: R$ 100,00
//    Deve: R$ 166,67
//    Balanço: -R$ 66,67
//
// 💳 DÉBITOS A PAGAR
// Maria Santos deve R$ 66,67 a João Silva
```

### Exemplo 5: Exportar CSV

```typescript
const csv = service.exportAsCSV('match-123');

// Salvar em arquivo ou enviar por email
console.log(csv);

// Saída:
// Data,Categoria,Descrição,Valor,Pagador,Participantes
// "12/02/2024","MEAT","Carne vermelha - 5kg",150,"João Silva","user-1; user-2; user-3"
// "12/02/2024","DRINK","Cerveja - 2 caixas",100,"Maria Santos","user-1; user-2; user-3; user-4"
```

## 🔄 Fluxo de Uso

### Passo 1: Iniciar Churrasco

```
Usuário abre a tela de churrasco
↓
Sistema carrega despesas anteriores (se houver)
↓
Exibe resumo atual
```

### Passo 2: Adicionar Despesa

```
Usuário clica em "+ Adicionar"
↓
Modal abre com formulário
↓
Usuário preenche:
  - Categoria (ex: Carnes)
  - Descrição (ex: Carne vermelha 5kg)
  - Valor (ex: R$ 150,00)
  - Quem pagou (ex: João Silva)
  - Dividir entre (ex: 3 pessoas)
↓
Usuário clica em "Adicionar"
↓
Despesa é salva
↓
Resumo é atualizado
```

### Passo 3: Visualizar Resumo

```
Usuário clica em "Ver Resumo"
↓
Modal exibe:
  - Total gasto
  - Número de despesas
  - Média por pessoa
  - Despesas por categoria
  - Balanço por participante
  - Débitos a pagar
```

### Passo 4: Marcar Débito como Pago

```
Usuário vê débito pendente
↓
Clica em "✓ Pago"
↓
Débito é marcado como pago
↓
Data de pagamento é registrada
```

## 📊 Categorias Disponíveis

| ID | Nome | Ícone |
|----|------|-------|
| MEAT | Carnes | 🥩 |
| DRINK | Bebidas | 🍺 |
| SIDE_DISH | Acompanhamentos | 🥗 |
| ICE | Gelo | 🧊 |
| CHARCOAL | Carvão | 🔥 |
| OTHER | Outro | 📦 |

## 💡 Dicas de Uso

### Divisão Automática

Quando você adiciona uma despesa, o sistema divide automaticamente o custo entre os participantes selecionados.

```
Despesa: R$ 150,00
Dividida entre: 3 pessoas
Custo por pessoa: R$ 50,00
```

### Consolidação de Débitos

O sistema consolida débitos para simplificar pagamentos:

```
Antes:
- João deve R$ 30 a Maria
- Maria deve R$ 20 a João

Depois:
- João deve R$ 10 a Maria
```

### Relatório Detalhado

Gere relatórios para:
- Compartilhar com participantes
- Registrar em planilha
- Enviar por email
- Imprimir

## 🔒 Segurança

- ✅ Dados salvos localmente
- ✅ Sincronização com backend (opcional)
- ✅ Validação de valores
- ✅ Histórico completo

## 📈 Métricas

- ✅ Total de despesas
- ✅ Média por pessoa
- ✅ Despesas por categoria
- ✅ Taxa de pagamento

## 🚀 Futuras Melhorias

- [ ] Foto do recibo
- [ ] Integração com pagamentos PIX
- [ ] Histórico de churrascos anteriores
- [ ] Estatísticas mensais
- [ ] Lembretes de pagamento

---

**Desenvolvido para simplificar o controle de despesas em churrascos** 🍖
