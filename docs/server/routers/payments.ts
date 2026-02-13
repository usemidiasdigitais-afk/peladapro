import { router, protectedProcedure, publicProcedure } from '@/server/trpc';
import { z } from 'zod';
import { db } from '@/server/db';
import { asaasConfig } from '@/drizzle/schema-payments';
import { eq } from 'drizzle-orm';
import { getAsaasPaymentService } from '@/server/services/asaas-payment-service';

export const paymentsRouter = router({
  /**
   * Configurar API Key do Asaas
   */
  configureAsaas: protectedProcedure
    .input(z.object({
      apiKey: z.string().min(1),
      environment: z.enum(['sandbox', 'production']),
      webhookSecret: z.string().optional(),
      pixKey: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Only admins can configure Asaas');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        // Testar conexão
        const service = getAsaasPaymentService(ctx.user.groupId, input.apiKey, input.environment);
        const testResult = await service.testConnection();

        if (!testResult.success) {
          return {
            success: false,
            error: 'Invalid API Key or connection failed',
          };
        }

        // Verificar se já existe configuração
        const existing = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, ctx.user.groupId),
        });

        if (existing) {
          // Atualizar
          await db.update(asaasConfig)
            .set({
              apiKey: input.apiKey,
              environment: input.environment,
              webhookSecret: input.webhookSecret,
              pixKey: input.pixKey,
              updatedAt: new Date(),
            })
            .where(eq(asaasConfig.groupId, ctx.user.groupId));
        } else {
          // Criar nova
          await db.insert(asaasConfig).values({
            groupId: ctx.user.groupId,
            apiKey: input.apiKey,
            environment: input.environment,
            webhookSecret: input.webhookSecret,
            pixKey: input.pixKey,
          });
        }

        return {
          success: true,
          message: 'Asaas configured successfully',
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to configure Asaas',
        };
      }
    }),

  /**
   * Criar cobrança PIX
   */
  createPixCharge: protectedProcedure
    .input(z.object({
      attendanceId: z.string().uuid(),
      matchId: z.string().uuid(),
      playerId: z.string().uuid(),
      amount: z.number().min(0.01),
      description: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        // Obter configuração Asaas
        const config = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, ctx.user.groupId),
        });

        if (!config || !config.isActive) {
          return {
            success: false,
            error: 'Asaas not configured for this group',
          };
        }

        // Criar serviço e cobrança
        const service = getAsaasPaymentService(ctx.user.groupId, config.apiKey, config.environment);
        const result = await service.createPixCharge({
          groupId: ctx.user.groupId,
          ...input,
        });

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to create PIX charge',
        };
      }
    }),

  /**
   * Criar cobrança Boleto
   */
  createBoletoCharge: protectedProcedure
    .input(z.object({
      attendanceId: z.string().uuid(),
      matchId: z.string().uuid(),
      playerId: z.string().uuid(),
      amount: z.number().min(0.01),
      description: z.string().min(1),
      dueDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        // Obter configuração Asaas
        const config = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, ctx.user.groupId),
        });

        if (!config || !config.isActive) {
          return {
            success: false,
            error: 'Asaas not configured for this group',
          };
        }

        // Criar serviço e cobrança
        const service = getAsaasPaymentService(ctx.user.groupId, config.apiKey, config.environment);
        const result = await service.createBoletoCharge({
          groupId: ctx.user.groupId,
          ...input,
        });

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to create Boleto charge',
        };
      }
    }),

  /**
   * Obter status de pagamento
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({
      asaasChargeId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        // Obter configuração Asaas
        const config = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, ctx.user.groupId),
        });

        if (!config) {
          return {
            success: false,
            error: 'Asaas not configured for this group',
          };
        }

        // Criar serviço e obter status
        const service = getAsaasPaymentService(ctx.user.groupId, config.apiKey, config.environment);
        const result = await service.getPaymentStatus(input.asaasChargeId, ctx.user.groupId);

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get payment status',
        };
      }
    }),

  /**
   * Listar pagamentos do grupo
   */
  listGroupPayments: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED', 'CANCELLED']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        // Obter configuração Asaas
        const config = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, ctx.user.groupId),
        });

        if (!config) {
          return {
            success: false,
            error: 'Asaas not configured for this group',
          };
        }

        // Criar serviço e listar pagamentos
        const service = getAsaasPaymentService(ctx.user.groupId, config.apiKey, config.environment);
        const result = await service.listGroupPayments(ctx.user.groupId, input.status);

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to list payments',
        };
      }
    }),

  /**
   * Obter resumo financeiro
   */
  getFinancialSummary: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== 'ADMIN') {
        throw new Error('Only admins can view financial summary');
      }

      if (!ctx.user.groupId) {
        throw new Error('User not in a group');
      }

      try {
        // Obter configuração Asaas
        const config = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, ctx.user.groupId),
        });

        if (!config) {
          return {
            success: false,
            error: 'Asaas not configured for this group',
          };
        }

        // Criar serviço e obter resumo
        const service = getAsaasPaymentService(ctx.user.groupId, config.apiKey, config.environment);
        const result = await service.getGroupFinancialSummary(ctx.user.groupId);

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to get financial summary',
        };
      }
    }),

  /**
   * Processar webhook (público)
   */
  processWebhook: publicProcedure
    .input(z.object({
      payload: z.any(),
      signature: z.string(),
      groupId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Obter configuração Asaas
        const config = await db.query.asaasConfig.findFirst({
          where: eq(asaasConfig.groupId, input.groupId),
        });

        if (!config || !config.webhookSecret) {
          return {
            success: false,
            error: 'Webhook not configured',
          };
        }

        // Criar serviço e processar webhook
        const service = getAsaasPaymentService(input.groupId, config.apiKey, config.environment);
        const result = await service.processWebhook(input.payload, input.signature, config.webhookSecret);

        return result;
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Failed to process webhook',
        };
      }
    }),
});
