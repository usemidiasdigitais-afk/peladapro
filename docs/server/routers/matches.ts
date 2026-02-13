import { router, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';
import { getMatchService } from '@/server/services/match-service';

const matchService = getMatchService();

export const matchesRouter = router({
  /**
   * Criar nova pelada
   */
  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      location: z.string().min(1),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      scheduledDate: z.date(),
      maxPlayers: z.number().min(2),
      maxGoalkeepers: z.number().min(1).default(2),
      pricePerPlayer: z.number().min(0).default(0),
      barbecuePrice: z.number().min(0).default(0),
      paymentRequired: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validar que é ADMIN
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Only admins can create matches');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const match = await matchService.createMatch({
          groupId: ctx.user.groupId,
          createdBy: ctx.user.id,
          ...input,
        });

        return {
          success: true,
          match,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Obter pelada por ID
   */
  getById: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const match = await matchService.getMatch(input.matchId, ctx.user.groupId);
        return {
          success: true,
          match,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Listar peladas do grupo
   */
  listGroup: protectedProcedure
    .input(z.object({
      status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const matches = await matchService.listGroupMatches(ctx.user.groupId, input.status);
        return {
          success: true,
          matches,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Atualizar pelada
   */
  update: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
      title: z.string().optional(),
      description: z.string().optional(),
      location: z.string().optional(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      scheduledDate: z.date().optional(),
      maxPlayers: z.number().optional(),
      maxGoalkeepers: z.number().optional(),
      pricePerPlayer: z.number().optional(),
      barbecuePrice: z.number().optional(),
      paymentRequired: z.boolean().optional(),
      status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Only admins can update matches');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const { matchId, ...updateData } = input;
        const match = await matchService.updateMatch(matchId, ctx.user.groupId, updateData);
        return {
          success: true,
          match,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Cancelar pelada
   */
  cancel: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Only admins can cancel matches');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const match = await matchService.cancelMatch(input.matchId, ctx.user.groupId);
        return {
          success: true,
          match: match[0],
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Confirmar presença
   */
  confirmAttendance: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
      position: z.enum(['FIELD', 'GOALKEEPER']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const attendance = await matchService.confirmAttendance(
          input.matchId,
          ctx.user.id,
          ctx.user.groupId,
          input.position
        );

        return {
          success: true,
          attendance: attendance[0],
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Cancelar presença
   */
  cancelAttendance: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const attendance = await matchService.cancelAttendance(
          input.matchId,
          ctx.user.id,
          ctx.user.groupId
        );

        return {
          success: true,
          attendance: attendance[0],
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Usar link de convite
   */
  useInviteLink: protectedProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const match = await matchService.useInviteLink(input.token, ctx.user.id);
        return {
          success: true,
          match,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Gerar novo link de convite
   */
  generateInviteLink: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Only admins can generate invite links');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const inviteLink = await matchService.generateInviteLink(input.matchId, ctx.user.groupId);
        return {
          success: true,
          inviteLink,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Obter estatísticas da pelada
   */
  getStats: protectedProcedure
    .input(z.object({
      matchId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        const stats = await matchService.getMatchStats(input.matchId, ctx.user.groupId);
        return {
          success: true,
          stats,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),
});
