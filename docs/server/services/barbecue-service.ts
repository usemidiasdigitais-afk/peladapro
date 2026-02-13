import { db } from '@/server/db';
import { barbecueExpenses, barbecueDebts } from '@/drizzle/schema-barbecue';
import { attendance } from '@/drizzle/schema-matches';
import { eq, and } from 'drizzle-orm';

export interface AddExpenseRequest {
  groupId: string;
  matchId: string;
  paidBy: string;
  category: string;
  description: string;
  amount: number;
  splitBetween: number;
}

export interface MarkDebtAsPaidRequest {
  debtId: string;
  groupId: string;
}

export class BarbecueService {
  /**
   * Adicionar despesa de churrasco
   */
  async addExpense(request: AddExpenseRequest) {
    try {
      // Validar que o usuário pertence ao grupo
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, request.paidBy),
          eq(users.groupId, request.groupId)
        ),
      });

      if (!user) {
        throw new Error('User not found in this group');
      }

      // Criar despesa
      const expense = await db.insert(barbecueExpenses).values({
        groupId: request.groupId,
        matchId: request.matchId,
        paidBy: request.paidBy,
        category: request.category,
        description: request.description,
        amount: request.amount,
        splitBetween: request.splitBetween,
      }).returning();

      // Calcular débitos
      await this.recalculateDebts(request.groupId, request.matchId);

      return {
        success: true,
        expense: expense[0],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to add expense',
      };
    }
  }

  /**
   * Remover despesa
   */
  async removeExpense(expenseId: string, groupId: string) {
    try {
      // Validar que a despesa pertence ao grupo
      const expense = await db.query.barbecueExpenses.findFirst({
        where: and(
          eq(barbecueExpenses.id, expenseId),
          eq(barbecueExpenses.groupId, groupId)
        ),
      });

      if (!expense) {
        throw new Error('Expense not found in this group');
      }

      // Deletar despesa
      await db.delete(barbecueExpenses).where(eq(barbecueExpenses.id, expenseId));

      // Recalcular débitos
      await this.recalculateDebts(groupId, expense.matchId);

      return {
        success: true,
        message: 'Expense removed successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove expense',
      };
    }
  }

  /**
   * Obter despesas da partida
   */
  async getMatchExpenses(matchId: string, groupId: string) {
    try {
      const expenses = await db.query.barbecueExpenses.findMany({
        where: and(
          eq(barbecueExpenses.matchId, matchId),
          eq(barbecueExpenses.groupId, groupId)
        ),
        with: {
          paidByUser: true,
        },
        orderBy: (barbecueExpenses, { desc }) => [desc(barbecueExpenses.createdAt)],
      });

      return {
        success: true,
        expenses,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get expenses',
      };
    }
  }

  /**
   * Obter débitos da partida
   */
  async getMatchDebts(matchId: string, groupId: string) {
    try {
      const debts = await db.query.barbecueDebts.findMany({
        where: and(
          eq(barbecueDebts.matchId, matchId),
          eq(barbecueDebts.groupId, groupId)
        ),
        with: {
          debtorUser: true,
          creditorUser: true,
        },
        orderBy: (barbecueDebts, { desc }) => [desc(barbecueDebts.createdAt)],
      });

      return {
        success: true,
        debts,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get debts',
      };
    }
  }

  /**
   * Marcar débito como pago
   */
  async markDebtAsPaid(request: MarkDebtAsPaidRequest) {
    try {
      // Validar que o débito pertence ao grupo
      const debt = await db.query.barbecueDebts.findFirst({
        where: and(
          eq(barbecueDebts.id, request.debtId),
          eq(barbecueDebts.groupId, request.groupId)
        ),
      });

      if (!debt) {
        throw new Error('Debt not found in this group');
      }

      // Marcar como pago
      const updated = await db.update(barbecueDebts)
        .set({
          isPaid: true,
          paidAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(barbecueDebts.id, request.debtId))
        .returning();

      return {
        success: true,
        debt: updated[0],
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to mark debt as paid',
      };
    }
  }

  /**
   * Obter resumo de churrasco da partida
   */
  async getMatchSummary(matchId: string, groupId: string) {
    try {
      // Obter despesas
      const expenses = await db.query.barbecueExpenses.findMany({
        where: and(
          eq(barbecueExpenses.matchId, matchId),
          eq(barbecueExpenses.groupId, groupId)
        ),
      });

      // Obter presenças confirmadas
      const attendances = await db.query.attendance.findMany({
        where: and(
          eq(attendance.matchId, matchId),
          eq(attendance.status, 'CONFIRMED')
        ),
      });

      // Calcular totais
      const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const perPerson = attendances.length > 0 ? totalExpense / attendances.length : 0;

      // Agrupar por categoria
      const byCategory = expenses.reduce((acc: any, e) => {
        if (!acc[e.category]) {
          acc[e.category] = 0;
        }
        acc[e.category] += Number(e.amount);
        return acc;
      }, {});

      // Obter débitos não pagos
      const unpaidDebts = await db.query.barbecueDebts.findMany({
        where: and(
          eq(barbecueDebts.matchId, matchId),
          eq(barbecueDebts.groupId, groupId),
          eq(barbecueDebts.isPaid, false)
        ),
      });

      const totalUnpaidDebts = unpaidDebts.reduce((sum, d) => sum + Number(d.amount), 0);

      return {
        success: true,
        summary: {
          totalExpense,
          perPerson,
          confirmedPlayers: attendances.length,
          expenseCount: expenses.length,
          byCategory,
          unpaidDebts: unpaidDebts.length,
          totalUnpaidDebts,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get summary',
      };
    }
  }

  /**
   * Recalcular débitos da partida
   */
  private async recalculateDebts(groupId: string, matchId: string) {
    try {
      // Deletar débitos antigos
      const oldDebts = await db.query.barbecueDebts.findMany({
        where: and(
          eq(barbecueDebts.groupId, groupId),
          eq(barbecueDebts.matchId, matchId)
        ),
      });

      for (const debt of oldDebts) {
        await db.delete(barbecueDebts).where(eq(barbecueDebts.id, debt.id));
      }

      // Obter despesas
      const expenses = await db.query.barbecueExpenses.findMany({
        where: and(
          eq(barbecueExpenses.groupId, groupId),
          eq(barbecueExpenses.matchId, matchId)
        ),
      });

      // Obter presenças confirmadas
      const attendances = await db.query.attendance.findMany({
        where: and(
          eq(attendance.matchId, matchId),
          eq(attendance.status, 'CONFIRMED')
        ),
      });

      if (attendances.length === 0 || expenses.length === 0) {
        return;
      }

      // Calcular quanto cada pessoa deve
      const playerDebts: { [key: string]: number } = {};
      const playerCredits: { [key: string]: number } = {};

      // Inicializar
      for (const att of attendances) {
        playerDebts[att.playerId] = 0;
        playerCredits[att.playerId] = 0;
      }

      // Processar despesas
      for (const expense of expenses) {
        const perPerson = Number(expense.amount) / expense.splitBetween;

        // Quem pagou recebe crédito
        playerCredits[expense.paidBy] = (playerCredits[expense.paidBy] || 0) + Number(expense.amount);

        // Todos que dividem devem
        for (const att of attendances) {
          playerDebts[att.playerId] = (playerDebts[att.playerId] || 0) + perPerson;
        }
      }

      // Criar débitos
      for (const playerId of Object.keys(playerDebts)) {
        const debt = playerDebts[playerId];
        const credit = playerCredits[playerId] || 0;
        const net = debt - credit;

        if (net > 0) {
          // Este jogador deve dinheiro
          // Encontrar quem tem crédito
          for (const creditorId of Object.keys(playerCredits)) {
            const creditorNet = playerCredits[creditorId] - (playerDebts[creditorId] || 0);
            if (creditorNet > 0 && playerId !== creditorId) {
              const amount = Math.min(net, creditorNet);

              await db.insert(barbecueDebts).values({
                groupId,
                matchId,
                debtor: playerId,
                creditor: creditorId,
                amount: amount,
              });

              playerDebts[playerId] -= amount;
              playerCredits[creditorId] -= amount;
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to recalculate debts:', error);
    }
  }

  /**
   * Obter débitos totais de um jogador no grupo
   */
  async getPlayerGroupDebts(playerId: string, groupId: string) {
    try {
      const debts = await db.query.barbecueDebts.findMany({
        where: and(
          eq(barbecueDebts.debtor, playerId),
          eq(barbecueDebts.groupId, groupId),
          eq(barbecueDebts.isPaid, false)
        ),
        with: {
          creditorUser: true,
          match: true,
        },
      });

      const totalDebt = debts.reduce((sum, d) => sum + Number(d.amount), 0);

      return {
        success: true,
        debts,
        totalDebt,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get player debts',
      };
    }
  }

  /**
   * Obter créditos totais de um jogador no grupo
   */
  async getPlayerGroupCredits(playerId: string, groupId: string) {
    try {
      const credits = await db.query.barbecueDebts.findMany({
        where: and(
          eq(barbecueDebts.creditor, playerId),
          eq(barbecueDebts.groupId, groupId),
          eq(barbecueDebts.isPaid, false)
        ),
        with: {
          debtorUser: true,
          match: true,
        },
      });

      const totalCredit = credits.reduce((sum, c) => sum + Number(c.amount), 0);

      return {
        success: true,
        credits,
        totalCredit,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get player credits',
      };
    }
  }
}

export function getBarbecueService(): BarbecueService {
  return new BarbecueService();
}
