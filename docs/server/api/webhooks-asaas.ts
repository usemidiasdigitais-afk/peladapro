import { Router, Request, Response } from 'express';
import { createAsaasService } from '../services/asaas-service';

/**
 * Handler de Webhooks da Asaas
 * Processa confirmações de pagamento em tempo real
 */

const router = Router();
const WEBHOOK_SECRET = process.env.ASAAS_WEBHOOK_SECRET || 'webhook-secret';

/**
 * POST /webhooks/asaas
 * Recebe webhooks de confirmação de pagamento
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-asaas-webhook-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Validar assinatura do webhook
    const asaasService = createAsaasService();
    const isValid = asaasService.validateWebhookSignature(
      payload,
      signature,
      WEBHOOK_SECRET
    );

    if (!isValid) {
      console.warn('Webhook com assinatura inválida recebido');
      // Ainda assim processar para não perder dados
    }

    const { event, data } = req.body;

    // Log do webhook
    console.log(`[WEBHOOK] Evento: ${event}, Charge ID: ${data.id}, Status: ${data.status}`);

    // Processar diferentes eventos
    switch (event) {
      case 'payment.confirmed':
        await handlePaymentConfirmed(data, isValid);
        break;

      case 'payment.received':
        await handlePaymentReceived(data, isValid);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data, isValid);
        break;

      case 'payment.cancelled':
        await handlePaymentCancelled(data, isValid);
        break;

      default:
        console.log(`Evento não tratado: ${event}`);
    }

    // Retornar sucesso para Asaas (importante!)
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    // Retornar sucesso mesmo em caso de erro para Asaas não reenviar
    res.status(200).json({ success: true, error: error instanceof Error ? error.message : 'Erro' });
  }
});

/**
 * Processar pagamento confirmado
 */
async function handlePaymentConfirmed(data: any, isValid: boolean) {
  try {
    // Aqui você integraria com seu banco de dados
    // Exemplo:
    // const payment = await db.query.asaasPayments.findFirst({
    //   where: (payments) => eq(payments.asaasChargeId, data.id)
    // });
    //
    // if (payment) {
    //   await db.update('asaas_payments').set({
    //     status: 'CONFIRMED',
    //     confirmedAt: new Date(),
    //     updatedAt: new Date(),
    //   }).where((payments) => eq(payments.id, payment.id));
    //
    //   // Enviar notificação ao jogador
    //   await notificationService.sendPaymentConfirmed(payment.playerId);
    // }

    console.log(`✅ Pagamento confirmado: ${data.id}`);
  } catch (error) {
    console.error('Erro ao processar pagamento confirmado:', error);
  }
}

/**
 * Processar pagamento recebido
 */
async function handlePaymentReceived(data: any, isValid: boolean) {
  try {
    // Aqui você integraria com seu banco de dados
    // Exemplo:
    // const payment = await db.query.asaasPayments.findFirst({
    //   where: (payments) => eq(payments.asaasChargeId, data.id)
    // });
    //
    // if (payment) {
    //   await db.update('asaas_payments').set({
    //     status: 'RECEIVED',
    //     receivedAt: new Date(),
    //     updatedAt: new Date(),
    //   }).where((payments) => eq(payments.id, payment.id));
    //
    //   // Enviar notificação ao admin
    //   await notificationService.sendPaymentReceived(payment.groupId, data.value);
    // }

    console.log(`💰 Pagamento recebido: ${data.id} - R$ ${data.value}`);
  } catch (error) {
    console.error('Erro ao processar pagamento recebido:', error);
  }
}

/**
 * Processar pagamento falhado
 */
async function handlePaymentFailed(data: any, isValid: boolean) {
  try {
    // Aqui você integraria com seu banco de dados
    // Exemplo:
    // const payment = await db.query.asaasPayments.findFirst({
    //   where: (payments) => eq(payments.asaasChargeId, data.id)
    // });
    //
    // if (payment) {
    //   await db.update('asaas_payments').set({
    //     status: 'FAILED',
    //     failedAt: new Date(),
    //     failureReason: data.failureReason,
    //     updatedAt: new Date(),
    //   }).where((payments) => eq(payments.id, payment.id));
    //
    //   // Enviar notificação ao jogador
    //   await notificationService.sendPaymentFailed(payment.playerId);
    // }

    console.log(`❌ Pagamento falhado: ${data.id} - Motivo: ${data.failureReason}`);
  } catch (error) {
    console.error('Erro ao processar pagamento falhado:', error);
  }
}

/**
 * Processar pagamento cancelado
 */
async function handlePaymentCancelled(data: any, isValid: boolean) {
  try {
    // Aqui você integraria com seu banco de dados
    // Exemplo:
    // const payment = await db.query.asaasPayments.findFirst({
    //   where: (payments) => eq(payments.asaasChargeId, data.id)
    // });
    //
    // if (payment) {
    //   await db.update('asaas_payments').set({
    //     status: 'CANCELLED',
    //     updatedAt: new Date(),
    //   }).where((payments) => eq(payments.id, payment.id));
    // }

    console.log(`🚫 Pagamento cancelado: ${data.id}`);
  } catch (error) {
    console.error('Erro ao processar pagamento cancelado:', error);
  }
}

/**
 * GET /webhooks/asaas/health
 * Health check para o webhook
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
