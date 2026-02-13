import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { createAsaasService } from '../services/asaas-service';

/**
 * Roteador tRPC para Pagamentos Asaas
 * Endpoints para gerar cobranças PIX, consultar status e processar webhooks
 */

const CreatePaymentSchema = z.object({
  matchId: z.string().uuid(),
  playerId: z.string().uuid(),
  amount: z.string().regex(/^\d+(\.\d{2})?$/), // Validar formato de moeda
  description: z.string().optional(),
  daysUntilDue: z.number().int().min(1).max(30).default(3),
});

const GetPaymentStatusSchema = z.object({
  paymentId: z.string().uuid(),
});

const WebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string(),
    status: z.string(),
    value: z.number(),
    externalReference: z.string().optional(),
  }),
});

export const paymentsAsaasRouter = router({
  /**
   * Gerar cobrança PIX
   * Cria uma cobrança na Asaas e retorna QR Code
   */
  generatePixCharge: protectedProcedure
    .input(CreatePaymentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Validar acesso ao grupo
        const match = await ctx.db.query.matches.findFirst({
          where: (matches, { eq }) => eq(matches.id, input.matchId),
        });

        if (!match || match.groupId !== ctx.user.groupId) {
          throw new Error('Acesso negado a esta partida');
        }

        const player = await ctx.db.query.players.findFirst({
          where: (players, { eq }) => eq(players.id, input.playerId),
        });

        if (!player || player.groupId !== ctx.user.groupId) {
          throw new Error('Acesso negado a este jogador');
        }

        // Inicializar serviço Asaas
        const asaasService = createAsaasService();

        // Verificar ou criar cliente Asaas
        let asaasCustomer = await ctx.db.query.asaasCustomers.findFirst({
          where: (customers, { eq, and }) =>
            and(
              eq(customers.playerId, input.playerId),
              eq(customers.groupId, ctx.user.groupId)
            ),
        });

        if (!asaasCustomer) {
          // Criar cliente na Asaas
          const createdCustomer = await asaasService.createCustomer({
            name: player.name,
            email: player.email,
            phone: player.phone,
          });

          // Salvar no banco
          asaasCustomer = await ctx.db.insert('asaas_customers').values({
            groupId: ctx.user.groupId,
            playerId: input.playerId,
            asaasCustomerId: createdCustomer.id,
            name: createdCustomer.name,
            email: createdCustomer.email,
          });
        }

        // Criar cobrança na Asaas
        const dueDate = asaasService.calculateDueDate(input.daysUntilDue);
        const chargeResponse = await asaasService.createCharge({
          customer: asaasCustomer.asaasCustomerId,
          billingType: 'PIX',
          value: parseFloat(input.amount),
          dueDate,
          description: input.description || `Partida de futebol - ${match.sport}`,
          externalReference: input.matchId,
          notificationUrl: `${process.env.WEBHOOK_URL || 'http://localhost:3001'}/webhooks/asaas`,
        });

        // Salvar pagamento no banco
        const payment = await ctx.db.insert('asaas_payments').values({
          groupId: ctx.user.groupId,
          matchId: input.matchId,
          playerId: input.playerId,
          asaasChargeId: chargeResponse.id,
          amount: input.amount,
          description: input.description,
          status: 'PENDING',
          pixQrCode: chargeResponse.pixQrCode,
          pixCopiaeCola: chargeResponse.pixCopiaeCola,
          pixExpirationDate: chargeResponse.pixExpirationDate
            ? new Date(chargeResponse.pixExpirationDate)
            : undefined,
        });

        return {
          success: true,
          data: {
            paymentId: payment.id,
            asaasChargeId: chargeResponse.id,
            amount: input.amount,
            pixQrCode: chargeResponse.pixQrCode,
            pixCopiaeCola: chargeResponse.pixCopiaeCola,
            dueDate,
            status: 'PENDING',
          },
        };
      } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao gerar PIX',
        };
      }
    }),

  /**
   * Obter status de um pagamento
   */
  getPaymentStatus: protectedProcedure
    .input(GetPaymentStatusSchema)
    .query(async ({ input, ctx }) => {
      try {
        const payment = await ctx.db.query.asaasPayments.findFirst({
          where: (payments, { eq }) => eq(payments.id, input.paymentId),
        });

        if (!payment || payment.groupId !== ctx.user.groupId) {
          throw new Error('Acesso negado');
        }

        // Se status é PENDING, consultar Asaas
        if (payment.status === 'PENDING') {
          const asaasService = createAsaasService();
          const chargeStatus = await asaasService.getCharge(payment.asaasChargeId);

          // Atualizar status no banco se mudou
          if (chargeStatus.status !== payment.status) {
            await ctx.db
              .update('asaas_payments')
              .set({
                status: chargeStatus.status,
                confirmedAt: chargeStatus.status === 'CONFIRMED' ? new Date() : undefined,
                receivedAt: chargeStatus.status === 'RECEIVED' ? new Date() : undefined,
                updatedAt: new Date(),
              })
              .where((payments, { eq }) => eq(payments.id, input.paymentId));
          }
        }

        return {
          success: true,
          data: {
            paymentId: payment.id,
            status: payment.status,
            amount: payment.amount,
            pixQrCode: payment.pixQrCode,
            pixCopiaeCola: payment.pixCopiaeCola,
            confirmedAt: payment.confirmedAt,
            receivedAt: payment.receivedAt,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao obter status',
        };
      }
    }),

  /**
   * Listar pagamentos de uma partida
   */
  listMatchPayments: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const match = await ctx.db.query.matches.findFirst({
          where: (matches, { eq }) => eq(matches.id, input.matchId),
        });

        if (!match || match.groupId !== ctx.user.groupId) {
          throw new Error('Acesso negado');
        }

        const payments = await ctx.db.query.asaasPayments.findMany({
          where: (payments, { eq, and }) =>
            and(
              eq(payments.matchId, input.matchId),
              eq(payments.groupId, ctx.user.groupId)
            ),
        });

        const summary = {
          total: payments.length,
          pending: payments.filter((p) => p.status === 'PENDING').length,
          confirmed: payments.filter((p) => p.status === 'CONFIRMED').length,
          received: payments.filter((p) => p.status === 'RECEIVED').length,
          failed: payments.filter((p) => p.status === 'FAILED').length,
          totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        };

        return {
          success: true,
          data: {
            payments,
            summary,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao listar pagamentos',
        };
      }
    }),

  /**
   * Listar pagamentos de um jogador
   */
  listPlayerPayments: protectedProcedure
    .input(z.object({ playerId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      try {
        const player = await ctx.db.query.players.findFirst({
          where: (players, { eq }) => eq(players.id, input.playerId),
        });

        if (!player || player.groupId !== ctx.user.groupId) {
          throw new Error('Acesso negado');
        }

        const payments = await ctx.db.query.asaasPayments.findMany({
          where: (payments, { eq, and }) =>
            and(
              eq(payments.playerId, input.playerId),
              eq(payments.groupId, ctx.user.groupId)
            ),
        });

        return {
          success: true,
          data: payments,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao listar pagamentos',
        };
      }
    }),

  /**
   * Cancelar pagamento
   */
  cancelPayment: protectedProcedure
    .input(z.object({ paymentId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const payment = await ctx.db.query.asaasPayments.findFirst({
          where: (payments, { eq }) => eq(payments.id, input.paymentId),
        });

        if (!payment || payment.groupId !== ctx.user.groupId) {
          throw new Error('Acesso negado');
        }

        // Cancelar na Asaas
        const asaasService = createAsaasService();
        await asaasService.cancelCharge(payment.asaasChargeId);

        // Atualizar no banco
        await ctx.db
          .update('asaas_payments')
          .set({
            status: 'CANCELLED',
            updatedAt: new Date(),
          })
          .where((payments, { eq }) => eq(payments.id, input.paymentId));

        return {
          success: true,
          message: 'Pagamento cancelado com sucesso',
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao cancelar pagamento',
        };
      }
    }),

  /**
   * Obter resumo de pagamentos do grupo
   */
  getGroupPaymentsSummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      const payments = await ctx.db.query.asaasPayments.findMany({
        where: (payments, { eq }) => eq(payments.groupId, ctx.user.groupId),
      });

      const summary = {
        total: payments.length,
        pending: payments.filter((p) => p.status === 'PENDING').length,
        confirmed: payments.filter((p) => p.status === 'CONFIRMED').length,
        received: payments.filter((p) => p.status === 'RECEIVED').length,
        failed: payments.filter((p) => p.status === 'FAILED').length,
        totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.amount), 0),
        receivedAmount: payments
          .filter((p) => p.status === 'RECEIVED')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      };

      return {
        success: true,
        data: summary,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter resumo',
      };
    }
  }),
});
