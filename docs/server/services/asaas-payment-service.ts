import axios, { AxiosInstance } from 'axios';
import { db } from '@/server/db';
import { asaasPayments, asaasConfig, webhookLogs } from '@/drizzle/schema-payments';
import { attendance } from '@/drizzle/schema-matches';
import { eq, and } from 'drizzle-orm';
import * as crypto from 'crypto';

export interface CreateChargeRequest {
  groupId: string;
  attendanceId: string;
  matchId: string;
  playerId: string;
  amount: number;
  description: string;
  dueDate?: Date;
  paymentType?: 'PIX' | 'BOLETO';
}

export interface WebhookPayload {
  id: string;
  event: string;
  data: {
    id: string;
    status: string;
    value: number;
    [key: string]: any;
  };
}

export class AsaasPaymentService {
  private client: AxiosInstance;
  private groupId: string;
  private apiKey: string;
  private environment: string;

  constructor(groupId: string, apiKey: string, environment: string = 'sandbox') {
    this.groupId = groupId;
    this.apiKey = apiKey;
    this.environment = environment;

    const baseURL = environment === 'sandbox'
      ? 'https://sandbox.asaas.com/api/v3'
      : 'https://api.asaas.com/api/v3';

    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Criar cobrança PIX
   */
  async createPixCharge(request: CreateChargeRequest) {
    try {
      // Validar que a presença pertence ao grupo
      const att = await db.query.attendance.findFirst({
        where: and(
          eq(attendance.id, request.attendanceId),
        ),
        with: {
          match: true,
        },
      });

      if (!att || att.match.groupId !== request.groupId) {
        throw new Error('Attendance not found in this group');
      }

      // Criar cobrança na Asaas
      const response = await this.client.post('/payments', {
        customer: {
          name: `Player ${request.playerId}`,
          email: `player-${request.playerId}@peladapro.com`,
        },
        billingType: 'PIX',
        value: request.amount,
        description: request.description,
        dueDate: request.dueDate ? request.dueDate.toISOString().split('T')[0] : new Date(Date.now() + 15 * 60 * 1000).toISOString().split('T')[0],
      });

      const chargeId = response.data.id;

      // Gerar QR Code PIX
      const pixResponse = await this.client.get(`/payments/${chargeId}/pix`);

      // Salvar no banco de dados
      const payment = await db.insert(asaasPayments).values({
        groupId: request.groupId,
        attendanceId: request.attendanceId,
        matchId: request.matchId,
        playerId: request.playerId,
        asaasChargeId: chargeId,
        amount: request.amount,
        paymentType: 'PIX',
        status: 'PENDING',
        pixQrCode: pixResponse.data.qrCode,
        pixCopiaeCola: pixResponse.data.qrCodeUrl,
        dueDate: new Date(Date.now() + 15 * 60 * 1000), // 15 minutos
      }).returning();

      return {
        success: true,
        payment: payment[0],
        pixQrCode: pixResponse.data.qrCode,
        pixCopiaeCola: pixResponse.data.qrCodeUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create PIX charge',
      };
    }
  }

  /**
   * Criar cobrança Boleto
   */
  async createBoletoCharge(request: CreateChargeRequest) {
    try {
      // Validar que a presença pertence ao grupo
      const att = await db.query.attendance.findFirst({
        where: eq(attendance.id, request.attendanceId),
        with: {
          match: true,
        },
      });

      if (!att || att.match.groupId !== request.groupId) {
        throw new Error('Attendance not found in this group');
      }

      // Criar cobrança na Asaas
      const dueDate = request.dueDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 dias
      const response = await this.client.post('/payments', {
        customer: {
          name: `Player ${request.playerId}`,
          email: `player-${request.playerId}@peladapro.com`,
        },
        billingType: 'BOLETO',
        value: request.amount,
        description: request.description,
        dueDate: dueDate.toISOString().split('T')[0],
      });

      const chargeId = response.data.id;

      // Salvar no banco de dados
      const payment = await db.insert(asaasPayments).values({
        groupId: request.groupId,
        attendanceId: request.attendanceId,
        matchId: request.matchId,
        playerId: request.playerId,
        asaasChargeId: chargeId,
        amount: request.amount,
        paymentType: 'BOLETO',
        status: 'PENDING',
        barcodeNumber: response.data.barcodeNumber,
        dueDate: dueDate,
      }).returning();

      return {
        success: true,
        payment: payment[0],
        barcodeNumber: response.data.barcodeNumber,
        barcodePNG: response.data.barcodePNG,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create Boleto charge',
      };
    }
  }

  /**
   * Obter status de pagamento
   */
  async getPaymentStatus(asaasChargeId: string, groupId: string) {
    try {
      // Validar que o pagamento pertence ao grupo
      const payment = await db.query.asaasPayments.findFirst({
        where: and(
          eq(asaasPayments.asaasChargeId, asaasChargeId),
          eq(asaasPayments.groupId, groupId)
        ),
      });

      if (!payment) {
        throw new Error('Payment not found in this group');
      }

      // Buscar status na Asaas
      const response = await this.client.get(`/payments/${asaasChargeId}`);

      return {
        success: true,
        status: response.data.status,
        payment: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get payment status',
      };
    }
  }

  /**
   * Processar webhook de pagamento
   */
  async processWebhook(payload: WebhookPayload, signature: string, webhookSecret: string) {
    try {
      // Validar assinatura
      const isValid = this.validateSignature(JSON.stringify(payload), signature, webhookSecret);

      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }

      // Log do webhook
      const log = await db.insert(webhookLogs).values({
        event: payload.event,
        asaasChargeId: payload.data.id,
        payload: JSON.stringify(payload),
        isValid: true,
        processed: false,
      }).returning();

      // Processar evento
      if (payload.event === 'payment.confirmed' || payload.event === 'payment.received') {
        const payment = await db.query.asaasPayments.findFirst({
          where: eq(asaasPayments.asaasChargeId, payload.data.id),
        });

        if (payment) {
          // Atualizar status de pagamento
          await db.update(asaasPayments)
            .set({
              status: 'CONFIRMED',
              confirmedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(asaasPayments.id, payment.id));

          // Atualizar status de presença
          await db.update(attendance)
            .set({
              paymentStatus: 'CONFIRMED',
              updatedAt: new Date(),
            })
            .where(eq(attendance.id, payment.attendanceId));

          // Marcar webhook como processado
          await db.update(webhookLogs)
            .set({ processed: true })
            .where(eq(webhookLogs.id, log[0].id));
        }
      }

      return {
        success: true,
        message: 'Webhook processed successfully',
      };
    } catch (error: any) {
      // Log de erro
      await db.insert(webhookLogs).values({
        event: payload.event,
        asaasChargeId: payload.data.id,
        payload: JSON.stringify(payload),
        isValid: false,
        processed: false,
        error: error.message,
      });

      return {
        success: false,
        error: error.message || 'Failed to process webhook',
      };
    }
  }

  /**
   * Validar assinatura do webhook
   */
  private validateSignature(payload: string, signature: string, secret: string): boolean {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Testar conexão com Asaas
   */
  async testConnection() {
    try {
      const response = await this.client.get('/accounts');
      return {
        success: true,
        account: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Asaas',
      };
    }
  }

  /**
   * Listar pagamentos do grupo
   */
  async listGroupPayments(groupId: string, status?: string) {
    try {
      let query = db.query.asaasPayments.findMany({
        where: eq(asaasPayments.groupId, groupId),
        with: {
          player: true,
          match: true,
        },
        orderBy: (asaasPayments, { desc }) => [desc(asaasPayments.createdAt)],
      });

      if (status) {
        query = db.query.asaasPayments.findMany({
          where: and(
            eq(asaasPayments.groupId, groupId),
            eq(asaasPayments.status, status)
          ),
          with: {
            player: true,
            match: true,
          },
          orderBy: (asaasPayments, { desc }) => [desc(asaasPayments.createdAt)],
        });
      }

      return {
        success: true,
        payments: query,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list payments',
      };
    }
  }

  /**
   * Obter resumo financeiro do grupo
   */
  async getGroupFinancialSummary(groupId: string) {
    try {
      const payments = await db.query.asaasPayments.findMany({
        where: eq(asaasPayments.groupId, groupId),
      });

      const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const confirmed = payments
        .filter(p => p.status === 'CONFIRMED')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const pending = payments
        .filter(p => p.status === 'PENDING')
        .reduce((sum, p) => sum + Number(p.amount), 0);
      const failed = payments
        .filter(p => p.status === 'FAILED')
        .reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        success: true,
        summary: {
          total,
          confirmed,
          pending,
          failed,
          totalPayments: payments.length,
          confirmedPayments: payments.filter(p => p.status === 'CONFIRMED').length,
          pendingPayments: payments.filter(p => p.status === 'PENDING').length,
          failedPayments: payments.filter(p => p.status === 'FAILED').length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get financial summary',
      };
    }
  }
}

export function getAsaasPaymentService(groupId: string, apiKey: string, environment: string = 'sandbox'): AsaasPaymentService {
  return new AsaasPaymentService(groupId, apiKey, environment);
}
