import { router, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';
import { getBarbecueService } from '@/server/services/barbecue-service';

const barbecueService = getBarbecueService();

export const barbecueRouter = router({
  /**
   * Adicionar despesa de churrasco
   */
  addExpense: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
      category: z.enum(['MEAT', 'DRINKS', 'SIDES', 'ICE', 'CHARCOAL', 'OTHER']),
      description: z.string().min(1),
      amount: z.number().min(0.01),
      splitBetween: z.number().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.addExpense({
          groupId: ctx.user.groupId,
          matchId: input.matchId,
          paidBy: ctx.user.id,
          category: input.category,
          description: input.description,
          amount: input.amount,
          splitBetween: input.splitBetween,
        });

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to add expense',
        };
      }
    }),

  /**
   * Remover despesa
   */
  removeExpense: protectedProcedure
    .input(z.object({
      expenseId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.removeExpense(input.expenseId, ctx.user.groupId);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to remove expense',
        };
      }
    }),

  /**
   * Obter despesas da partida
   */
  getMatchExpenses: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.getMatchExpenses(input.matchId, ctx.user.groupId);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get expenses',
        };
      }
    }),

  /**
   * Obter débitos da partida
   */
  getMatchDebts: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.getMatchDebts(input.matchId, ctx.user.groupId);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get debts',
        };
      }
    }),

  /**
   * Marcar débito como pago
   */
  markDebtAsPaid: protectedProcedure
    .input(z.object({
      debtId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.markDebtAsPaid({
          debtId: input.debtId,
          groupId: ctx.user.groupId,
        });

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to mark debt as paid',
        };
      }
    }),

  /**
   * Obter resumo de churrasco da partida
   */
  getMatchSummary: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.getMatchSummary(input.matchId, ctx.user.groupId);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get summary',
        };
      }
    }),

  /**
   * Obter débitos totais do jogador no grupo
   */
  getPlayerGroupDebts: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.getPlayerGroupDebts(ctx.user.id, ctx.user.groupId);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get debts',
        };
      }
    }),

  /**
   * Obter créditos totais do jogador no grupo
   */
  getPlayerGroupCredits: protectedProcedure
    .query(async ({ ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const result = await barbecueService.getPlayerGroupCredits(ctx.user.id, ctx.user.groupId);
        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get credits',
        };
      }
    }),
});
