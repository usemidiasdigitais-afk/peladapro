import axios, { AxiosInstance } from 'axios';
import { getSecureAPIClient } from './secure-api';

interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  webhookUrl?: string;
}

interface CreateChargeRequest {
  groupId: string;
  customerId?: string;
  customer: {
    name: string;
    email: string;
    cpfCnpj?: string;
  };
  amount: number;
  description: string;
  dueDate: string; // YYYY-MM-DD
  notificationEnabled?: boolean;
}

interface ChargeResponse {
  id: string;
  groupId: string;
  status: 'PENDING' | 'CONFIRMED' | 'RECEIVED' | 'OVERDUE' | 'CANCELLED';
  amount: number;
  pixQrCode?: string;
  pixCopiaeCola?: string;
  barCode?: string;
  dueDate: string;
  createdAt: string;
  confirmedAt?: string;
}

interface WebhookPayload {
  id: string;
  event: 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PAYMENT_OVERDUE';
  payment: {
    id: string;
    status: string;
    amount: number;
    confirmedDate?: string;
  };
}

class AsaasPaymentService {
  private client: AxiosInstance;
  private config: AsaasConfig | null = null;
  private currentGroupId: string | null = null;

  constructor() {
    this.client = axios.create();
  }

  /**
   * Inicializar serviço com configurações do grupo
   */
  async initialize(groupId: string): Promise<void> {
    this.currentGroupId = groupId;

    try {
      // Buscar configurações de pagamento do grupo
      const api = getSecureAPIClient();
      const settings = await api.get(`/groups/${groupId}/payment-settings`);

      this.config = {
        apiKey: settings.asaasApiKey,
        environment: settings.asaasEnvironment || 'sandbox',
        webhookUrl: settings.webhookUrl,
      };

      // Configurar cliente HTTP com credenciais
      this.client = axios.create({
        baseURL: this.getAsaasBaseUrl(),
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      throw new Error(`Falha ao inicializar Asaas: ${error}`);
    }
  }

  /**
   * Criar cobrança PIX
   */
  async createPixCharge(request: CreateChargeRequest): Promise<ChargeResponse> {
    if (!this.config) {
      throw new Error('Asaas não inicializado. Chame initialize() primeiro.');
    }

    // Validar isolamento de grupo
    if (request.groupId !== this.currentGroupId) {
      throw new Error('Multi-tenancy violation: group_id mismatch');
    }

    try {
      // Criar cliente se não existir
      let customerId = request.customerId;
      if (!customerId) {
        customerId = await this.createCustomer(request.customer, request.groupId);
      }

      // Criar cobrança
      const response = await this.client.post('/payments', {
        customerId,
        billingType: 'PIX',
        value: request.amount,
        description: request.description,
        dueDate: request.dueDate,
        notificationEnabled: request.notificationEnabled !== false,
      });

      // Gerar QR Code PIX
      const pixData = await this.getPixQrCode(response.data.id);

      return {
        id: response.data.id,
        groupId: request.groupId,
        status: response.data.status,
        amount: response.data.value,
        pixQrCode: pixData.qrCode,
        pixCopiaeCola: pixData.copiaeCola,
        dueDate: response.data.dueDate,
        createdAt: response.data.dateCreated,
      };
    } catch (error: any) {
      throw new Error(`Erro ao criar cobrança PIX: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Obter status de cobrança
   */
  async getChargeStatus(chargeId: string, groupId: string): Promise<ChargeResponse> {
    if (!this.config) {
      throw new Error('Asaas não inicializado');
    }

    // Validar isolamento
    if (groupId !== this.currentGroupId) {
      throw new Error('Multi-tenancy violation: group_id mismatch');
    }

    try {
      const response = await this.client.get(`/payments/${chargeId}`);

      return {
        id: response.data.id,
        groupId,
        status: response.data.status,
        amount: response.data.value,
        dueDate: response.data.dueDate,
        createdAt: response.data.dateCreated,
        confirmedAt: response.data.dateCreated,
      };
    } catch (error: any) {
      throw new Error(`Erro ao obter status: ${error.message}`);
    }
  }

  /**
   * Listar cobranças do grupo
   */
  async listCharges(groupId: string, filters?: any): Promise<ChargeResponse[]> {
    if (!this.config) {
      throw new Error('Asaas não inicializado');
    }

    // Validar isolamento
    if (groupId !== this.currentGroupId) {
      throw new Error('Multi-tenancy violation: group_id mismatch');
    }

    try {
      const response = await this.client.get('/payments', {
        params: {
          limit: filters?.limit || 100,
          offset: filters?.offset || 0,
          status: filters?.status,
        },
      });

      return response.data.data.map((charge: any) => ({
        id: charge.id,
        groupId,
        status: charge.status,
        amount: charge.value,
        pixQrCode: charge.pixQrCode,
        pixCopiaeCola: charge.pixCopiaeCola,
        dueDate: charge.dueDate,
        createdAt: charge.dateCreated,
      }));
    } catch (error: any) {
      throw new Error(`Erro ao listar cobranças: ${error.message}`);
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelCharge(chargeId: string, groupId: string): Promise<void> {
    if (!this.config) {
      throw new Error('Asaas não inicializado');
    }

    // Validar isolamento
    if (groupId !== this.currentGroupId) {
      throw new Error('Multi-tenancy violation: group_id mismatch');
    }

    try {
      await this.client.delete(`/payments/${chargeId}`);
    } catch (error: any) {
      throw new Error(`Erro ao cancelar cobrança: ${error.message}`);
    }
  }

  /**
   * Criar cliente no Asaas
   */
  private async createCustomer(customer: any, groupId: string): Promise<string> {
    try {
      const response = await this.client.post('/customers', {
        name: customer.name,
        email: customer.email,
        cpfCnpj: customer.cpfCnpj,
        groupId, // Armazenar group_id para auditoria
      });

      return response.data.id;
    } catch (error: any) {
      throw new Error(`Erro ao criar cliente: ${error.message}`);
    }
  }

  /**
   * Obter QR Code PIX
   */
  private async getPixQrCode(chargeId: string): Promise<{ qrCode: string; copiaeCola: string }> {
    try {
      const response = await this.client.get(`/payments/${chargeId}/qrcode`);

      return {
        qrCode: response.data.qrCode,
        copiaeCola: response.data.copiaeCola,
      };
    } catch (error: any) {
      throw new Error(`Erro ao gerar QR Code: ${error.message}`);
    }
  }

  /**
   * Validar webhook signature
   */
  validateWebhookSignature(payload: any, signature: string): boolean {
    if (!this.config) return false;

    // Implementar validação HMAC-SHA256
    // Asaas usa: HMAC-SHA256(payload, webhookSecret)
    const crypto = require('crypto');
    const hash = crypto
      .createHmac('sha256', this.config.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Processar webhook de pagamento
   */
  async processWebhook(payload: WebhookPayload, groupId: string): Promise<void> {
    // Validar isolamento
    if (groupId !== this.currentGroupId) {
      throw new Error('Multi-tenancy violation: group_id mismatch');
    }

    try {
      const api = getSecureAPIClient();

      // Atualizar status de pagamento no banco de dados
      await api.post(`/payments/${payload.payment.id}/confirm`, {
        groupId,
        status: payload.payment.status,
        confirmedAt: payload.payment.confirmedDate,
      });

      // Emitir evento para atualizar UI
      // EventEmitter.emit('payment:confirmed', { chargeId: payload.payment.id, groupId });
    } catch (error: any) {
      throw new Error(`Erro ao processar webhook: ${error.message}`);
    }
  }

  /**
   * Obter URL base do Asaas
   */
  private getAsaasBaseUrl(): string {
    if (!this.config) return '';
    return this.config.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/v3';
  }

  /**
   * Obter status da conexão
   */
  async testConnection(): Promise<boolean> {
    if (!this.config) return false;

    try {
      await this.client.get('/accounts');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton
let asaasInstance: AsaasPaymentService | null = null;

export function getAsaasService(): AsaasPaymentService {
  if (!asaasInstance) {
    asaasInstance = new AsaasPaymentService();
  }
  return asaasInstance;
}

export async function initializeAsaas(groupId: string): Promise<void> {
  const service = getAsaasService();
  await service.initialize(groupId);
}
