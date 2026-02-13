import { router, publicProcedure, protectedProcedure } from '@/server/trpc';
import { z } from 'zod';
import { getAuthService } from '@/server/services/auth-service';

const authService = getAuthService();

export const authRouter = router({
  /**
   * Login com email e senha
   */
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await authService.login(input);
        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Signup - criar novo usuário
   */
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
      role: z.enum(['SUPER_ADMIN', 'ADMIN', 'PLAYER']),
      groupId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const result = await authService.signup(input);
        return {
          success: true,
          user: result.user,
          token: result.token,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Validar token
   */
  validateToken: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .query(async ({ input }) => {
      const user = await authService.validateToken(input.token);
      return {
        valid: user !== null,
        user,
      };
    }),

  /**
   * Logout
   */
  logout: protectedProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await authService.logout(ctx.user.id, input.token);
        return {
          success: true,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * Obter usuário atual
   */
  me: protectedProcedure
    .query(async ({ ctx }) => {
      return {
        user: ctx.user,
      };
    }),

  /**
   * Obter grupo do usuário
   */
  getMyGroup: protectedProcedure
    .query(async ({ ctx }) => {
      const group = await authService.getUserGroup(ctx.user.id);
      return {
        group,
      };
    }),

  /**
   * Listar usuários do grupo (apenas ADMIN)
   */
  getGroupUsers: protectedProcedure
    .query(async ({ ctx }) => {
      // Validar que é ADMIN
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Access denied');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      const groupUsers = await authService.getGroupUsers(ctx.user.groupId);
      return {
        users: groupUsers,
      };
    }),

  /**
   * Listar todos os grupos (apenas SUPER_ADMIN)
   */
  getAllGroups: protectedProcedure
    .query(async ({ ctx }) => {
      // Validar que é SUPER_ADMIN
      if (ctx.user.role !== 'SUPER_ADMIN') {
        throw new Error('Access denied');
      }

      const groups = await authService.getAllGroups();
      return {
        groups,
      };
    }),
});
