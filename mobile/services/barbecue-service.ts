/**
 * Serviço de Gerenciamento de Despesas de Churrasco
 * 
 * Controla gastos, divide custos entre participantes e calcula quem deve a quem.
 */

export interface BarbecueExpense {
  id: string;
  matchId: string;
  category: 'MEAT' | 'DRINK' | 'SIDE_DISH' | 'ICE' | 'CHARCOAL' | 'OTHER';
  description: string;
  amount: number;
  paidBy: string; // ID do jogador que pagou
  paidByName: string;
  splitAmong: string[]; // IDs dos jogadores que vão dividir
  date: string;
  receipt?: string; // URL da foto do recibo
}

export interface BarbecueDebt {
  from: string; // ID do devedor
  fromName: string;
  to: string; // ID do credor
  toName: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface BarbecueSummary {
  matchId: string;
  totalExpenses: number;
  expensesByCategory: {
    [key: string]: number;
  };
  expenseCount: number;
  participantCount: number;
  averagePerPerson: number;
  debts: BarbecueDebt[];
  participants: {
    id: string;
    name: string;
    paid: number;
    owes: number;
    balance: number;
  }[];
}

export class BarbecueService {
  private expenses: Map<string, BarbecueExpense[]> = new Map();
  private debts: Map<string, BarbecueDebt[]> = new Map();

  /**
   * Adicionar despesa
   */
  addExpense(expense: BarbecueExpense): void {
    const key = expense.matchId;

    if (!this.expenses.has(key)) {
      this.expenses.set(key, []);
    }

    this.expenses.get(key)!.push(expense);
  }

  /**
   * Obter despesas de um churrasco
   */
  getExpenses(matchId: string): BarbecueExpense[] {
    return this.expenses.get(matchId) || [];
  }

  /**
   * Remover despesa
   */
  removeExpense(matchId: string, expenseId: string): void {
    const expenses = this.expenses.get(matchId);
    if (expenses) {
      const index = expenses.findIndex((e) => e.id === expenseId);
      if (index !== -1) {
        expenses.splice(index, 1);
      }
    }
  }

  /**
   * Calcular débitos baseado nas despesas
   */
  calculateDebts(matchId: string): BarbecueDebt[] {
    const expenses = this.getExpenses(matchId);
    const debts: BarbecueDebt[] = [];

    // Agrupar despesas por pessoa
    const personExpenses: { [key: string]: number } = {};
    const personPaid: { [key: string]: number } = {};

    for (const expense of expenses) {
      // Quanto cada pessoa deve pagar
      const amountPerPerson = expense.amount / expense.splitAmong.length;

      for (const personId of expense.splitAmong) {
        if (!personExpenses[personId]) {
          personExpenses[personId] = 0;
        }
        personExpenses[personId] += amountPerPerson;
      }

      // Quanto cada pessoa pagou
      if (!personPaid[expense.paidBy]) {
        personPaid[expense.paidBy] = 0;
      }
      personPaid[expense.paidBy] += expense.amount;
    }

    // Calcular quem deve a quem
    for (const personId in personExpenses) {
      const owes = personExpenses[personId];
      const paid = personPaid[personId] || 0;
      const balance = paid - owes;

      if (balance > 0) {
        // Esta pessoa pagou mais do que deve - é credora
        for (const otherId in personExpenses) {
          if (otherId === personId) continue;

          const otherOwes = personExpenses[otherId];
          const otherPaid = personPaid[otherId] || 0;
          const otherBalance = otherPaid - otherOwes;

          if (otherBalance < 0) {
            // Outra pessoa deve mais do que pagou - é devedora
            const debt = Math.min(balance, Math.abs(otherBalance));

            const expense = expenses.find((e) => e.paidBy === personId);
            const otherExpense = expenses.find((e) => e.paidBy === otherId);

            debts.push({
              from: otherId,
              fromName: otherExpense?.paidByName || otherId,
              to: personId,
              toName: expense?.paidByName || personId,
              amount: debt,
              isPaid: false,
            });
          }
        }
      }
    }

    // Remover débitos duplicados e consolidar
    const consolidatedDebts = this.consolidateDebts(debts);
    this.debts.set(matchId, consolidatedDebts);

    return consolidatedDebts;
  }

  /**
   * Consolidar débitos (remover duplicatas e simplificar)
   */
  private consolidateDebts(debts: BarbecueDebt[]): BarbecueDebt[] {
    const debtMap: { [key: string]: number } = {};

    for (const debt of debts) {
      const key = `${debt.from}-${debt.to}`;
      const reverseKey = `${debt.to}-${debt.from}`;

      if (debtMap[reverseKey]) {
        debtMap[reverseKey] -= debt.amount;
        if (debtMap[reverseKey] <= 0) {
          delete debtMap[reverseKey];
        }
      } else {
        debtMap[key] = (debtMap[key] || 0) + debt.amount;
      }
    }

    const consolidated: BarbecueDebt[] = [];
    for (const key in debtMap) {
      const [from, to] = key.split('-');
      const debt = debts.find((d) => d.from === from && d.to === to);

      if (debt && debtMap[key] > 0) {
        consolidated.push({
          ...debt,
          amount: debtMap[key],
        });
      }
    }

    return consolidated;
  }

  /**
   * Marcar débito como pago
   */
  markDebtAsPaid(matchId: string, debtIndex: number): void {
    const debts = this.debts.get(matchId);
    if (debts && debts[debtIndex]) {
      debts[debtIndex].isPaid = true;
      debts[debtIndex].paidDate = new Date().toISOString();
    }
  }

  /**
   * Gerar resumo completo do churrasco
   */
  generateSummary(matchId: string): BarbecueSummary {
    const expenses = this.getExpenses(matchId);
    const debts = this.calculateDebts(matchId);

    // Calcular totais por categoria
    const expensesByCategory: { [key: string]: number } = {};
    let totalExpenses = 0;

    for (const expense of expenses) {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += expense.amount;
      totalExpenses += expense.amount;
    }

    // Obter lista de participantes
    const participantSet = new Set<string>();
    for (const expense of expenses) {
      participantSet.add(expense.paidBy);
      expense.splitAmong.forEach((id) => participantSet.add(id));
    }

    // Calcular balanço por participante
    const participants = Array.from(participantSet).map((id) => {
      const paid = expenses
        .filter((e) => e.paidBy === id)
        .reduce((sum, e) => sum + e.amount, 0);

      const owes = expenses
        .filter((e) => e.splitAmong.includes(id))
        .reduce((sum, e) => sum + e.amount / e.splitAmong.length, 0);

      const participantName =
        expenses.find((e) => e.paidBy === id)?.paidByName ||
        expenses.find((e) => e.splitAmong.includes(id))?.paidByName ||
        id;

      return {
        id,
        name: participantName,
        paid,
        owes,
        balance: paid - owes,
      };
    });

    const averagePerPerson =
      totalExpenses / Math.max(participantSet.size, 1);

    return {
      matchId,
      totalExpenses,
      expensesByCategory,
      expenseCount: expenses.length,
      participantCount: participantSet.size,
      averagePerPerson,
      debts,
      participants: participants.sort((a, b) => b.balance - a.balance),
    };
  }

  /**
   * Obter categorias de despesa
   */
  getCategories(): { id: string; name: string; icon: string }[] {
    return [
      { id: 'MEAT', name: 'Carnes', icon: '🥩' },
      { id: 'DRINK', name: 'Bebidas', icon: '🍺' },
      { id: 'SIDE_DISH', name: 'Acompanhamentos', icon: '🥗' },
      { id: 'ICE', name: 'Gelo', icon: '🧊' },
      { id: 'CHARCOAL', name: 'Carvão', icon: '🔥' },
      { id: 'OTHER', name: 'Outro', icon: '📦' },
    ];
  }

  /**
   * Formatar valor para moeda
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Gerar relatório de despesas
   */
  generateReport(matchId: string): string {
    const summary = this.generateSummary(matchId);

    let report = `📊 RELATÓRIO DE DESPESAS - CHURRASCO\n`;
    report += `=====================================\n\n`;

    report += `💰 TOTAIS\n`;
    report += `Total Gasto: ${this.formatCurrency(summary.totalExpenses)}\n`;
    report += `Número de Despesas: ${summary.expenseCount}\n`;
    report += `Participantes: ${summary.participantCount}\n`;
    report += `Média por Pessoa: ${this.formatCurrency(summary.averagePerPerson)}\n\n`;

    report += `📋 DESPESAS POR CATEGORIA\n`;
    for (const [category, amount] of Object.entries(summary.expensesByCategory)) {
      report += `${category}: ${this.formatCurrency(amount)}\n`;
    }
    report += `\n`;

    report += `👥 BALANÇO POR PARTICIPANTE\n`;
    for (const participant of summary.participants) {
      const status = participant.balance > 0 ? '✅' : '❌';
      report += `${status} ${participant.name}\n`;
      report += `   Pagou: ${this.formatCurrency(participant.paid)}\n`;
      report += `   Deve: ${this.formatCurrency(participant.owes)}\n`;
      report += `   Balanço: ${this.formatCurrency(participant.balance)}\n\n`;
    }

    report += `💳 DÉBITOS A PAGAR\n`;
    if (summary.debts.length === 0) {
      report += `Nenhum débito pendente!\n`;
    } else {
      for (const debt of summary.debts) {
        if (!debt.isPaid) {
          report += `${debt.fromName} deve ${this.formatCurrency(debt.amount)} a ${debt.toName}\n`;
        }
      }
    }

    return report;
  }

  /**
   * Exportar despesas como CSV
   */
  exportAsCSV(matchId: string): string {
    const expenses = this.getExpenses(matchId);

    let csv = `Data,Categoria,Descrição,Valor,Pagador,Participantes\n`;

    for (const expense of expenses) {
      const date = new Date(expense.date).toLocaleDateString('pt-BR');
      const participants = expense.splitAmong.join('; ');

      csv += `"${date}","${expense.category}","${expense.description}",${expense.amount},"${expense.paidByName}","${participants}"\n`;
    }

    return csv;
  }
}

/**
 * Inicializar serviço de churrasco
 */
export function initBarbecueService(): BarbecueService {
  return new BarbecueService();
}

export default BarbecueService;
