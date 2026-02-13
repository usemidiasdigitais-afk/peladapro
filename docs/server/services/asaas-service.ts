import axios, { AxiosInstance } from 'axios';

/**
 * Serviço de integração com Asaas API
 * Responsável por:
 * - Criar cobranças PIX
 * - Gerar QR Codes dinâmicos
 * - Consultar status de pagamentos
 * - Processar webhooks de confirmação
 */

interface AsaasConfig {
  apiKey: string;
  environment: 'production' | 'sandbox';
}

interface CreateChargeRequest {
  customer: string; // Email ou ID do cliente
  billingType: 'PIX'; // Sempre PIX
  value: number; // Valor em reais (ex: 100.50)
  dueDate: string; // Data de vencimento (YYYY-MM-DD)
  description: string; // Descrição da cobrança
  externalReference?: string; // ID externo (ex: match_id)
  notificationUrl?: string; // URL para webhook
}

interface CreateChargeResponse {
  id: string; // ID da cobrança no Asaas
  customer: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string; // PENDING, RECEIVED, CONFIRMED, etc
  dueDate: string;
  description: string;
  externalReference?: string;
  pixQrCode?: string; // QR Code em base64
  pixCopiaeCola?: string; // Chave PIX para cópia e cola
  pixExpirationDate?: string;
  createdAt: string;
}

interface GetChargeResponse extends CreateChargeResponse {
  paymentDate?: string;
  confirmationDate?: string;
}

interface WebhookPayload {
  event: string; // payment.confirmed, payment.received, etc
  data: {
    id: string;
    customer: string;
    value: number;
    billingType: string;
    status: string;
    dueDate: string;
    description: string;
    externalReference?: string;
    paymentDate?: string;
    confirmationDate?: string;
    pixQrCode?: string;
    pixCopiaeCola?: string;
  };
}

export class AsaasService {
  private client: AxiosInstance;
  private apiKey: string;
  private environment: 'production' | 'sandbox';

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment;

    const baseURL =
      config.environment === 'production'
        ? 'https://api.asaas.com/v3'
        : 'https://sandbox.asaas.com/v3';

    this.client = axios.create({
      baseURL,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  /**
   * Criar cobrança PIX
   * Gera QR Code dinâmico e retorna dados para pagamento
   */
  async createCharge(request: CreateChargeRequest): Promise<CreateChargeResponse> {
    try {
      const response = await this.client.post<CreateChargeResponse>(
        '/payments',
        {
          customer: request.customer,
          billingType: 'PIX',
          value: request.value,
          dueDate: request.dueDate,
          description: request.description,
          externalReference: request.externalReference,
          notificationUrl: request.notificationUrl,
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Erro ao criar cobrança Asaas: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Obter status de uma cobrança
   */
  async getCharge(chargeId: string): Promise<GetChargeResponse> {
    try {
      const response = await this.client.get<GetChargeResponse>(
        `/payments/${chargeId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        `Erro ao obter cobrança Asaas: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Listar cobranças de um cliente
   */
  async listCharges(
    customerId: string,
    filters?: {
      status?: string;
      billingType?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: GetChargeResponse[]; hasMore: boolean }> {
    try {
      const response = await this.client.get<{
        data: GetChargeResponse[];
        hasMore: boolean;
      }>('/payments', {
        params: {
          customer: customerId,
          status: filters?.status,
          billingType: filters?.billingType || 'PIX',
          limit: filters?.limit || 100,
          offset: filters?.offset || 0,
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Erro ao listar cobranças Asaas: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelCharge(chargeId: string): Promise<{ success: boolean }> {
    try {
      await this.client.delete(`/payments/${chargeId}`);
      return { success: true };
    } catch (error) {
      throw new Error(
        `Erro ao cancelar cobrança Asaas: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Validar webhook signature
   * Asaas envia um header X-Asaas-Webhook-Signature com HMAC-SHA256
   */
  validateWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      console.error('Erro ao validar webhook signature:', error);
      return false;
    }
  }

  /**
   * Processar webhook de confirmação de pagamento
   */
  processWebhook(payload: WebhookPayload): {
    event: string;
    chargeId: string;
    status: string;
    externalReference?: string;
    value: number;
  } {
    return {
      event: payload.event,
      chargeId: payload.data.id,
      status: payload.data.status,
      externalReference: payload.data.externalReference,
      value: payload.data.value,
    };
  }

  /**
   * Criar cliente no Asaas (necessário para cobranças)
   */
  async createCustomer(customerData: {
    name: string;
    email: string;
    phone?: string;
    cpfCnpj?: string;
  }): Promise<{ id: string; name: string; email: string }> {
    try {
      const response = await this.client.post('/customers', {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        cpfCnpj: customerData.cpfCnpj,
      });

      return response.data;
    } catch (error) {
      throw new Error(
        `Erro ao criar cliente Asaas: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Obter cliente
   */
  async getCustomer(customerId: string): Promise<{ id: string; name: string; email: string }> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        `Erro ao obter cliente Asaas: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Gerar QR Code em base64 a partir de um brcode
   */
  async generateQRCode(brcode: string): Promise<string> {
    try {
      const qrcode = require('qrcode');
      const dataUrl = await qrcode.toDataURL(brcode);
      return dataUrl; // Retorna data URL (base64)
    } catch (error) {
      throw new Error(
        `Erro ao gerar QR Code: ${
          error instanceof Error ? error.message : 'Erro desconhecido'
        }`
      );
    }
  }

  /**
   * Formatar valor para Asaas (sempre com 2 casas decimais)
   */
  formatValue(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calcular data de vencimento (dias a partir de hoje)
   */
  calculateDueDate(daysFromNow: number = 3): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

/**
 * Factory para criar instância do serviço
 */
export function createAsaasService(): AsaasService {
  const apiKey = process.env.ASAAS_API_KEY;
  const environment = (process.env.ASAAS_ENVIRONMENT || process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox';

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada nas variáveis de ambiente');
  }

  console.log(`[AsaasService] Inicializado em modo: ${environment}`);
  console.log(`[AsaasService] API URL: ${environment === 'production' ? 'https://api.asaas.com/v3' : 'https://sandbox.asaas.com/v3'}`);

  return new AsaasService({
    apiKey,
    environment,
  });
}
