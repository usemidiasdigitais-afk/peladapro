import axios, { AxiosInstance } from 'axios';

interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
}

interface CreateChargeRequest {
  customer: string;
  billingType: 'PIX' | 'BOLETO';
  value: number;
  dueDate: string;
  description: string;
}

interface CreateChargeResponse {
  id: string;
  status: string;
  billingType: string;
  value: number;
  dueDate: string;
  pixQrCode?: string;
  pixCopiaeCola?: string;
  boletoDigitableLine?: string;
  boletoBarCode?: string;
  invoiceUrl?: string;
  createdAt: string;
}

interface CreateCustomerRequest {
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
}

interface CreateCustomerResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpfCnpj?: string;
  createdAt: string;
}

interface GetChargeResponse {
  id: string;
  status: string;
  billingType: string;
  value: number;
  dueDate: string;
  paidDate?: string;
  paidValue?: number;
  pixQrCode?: string;
  pixCopiaeCola?: string;
  boletoDigitableLine?: string;
  boletoBarCode?: string;
  invoiceUrl?: string;
  createdAt: string;
}

export class AsaasService {
  private client: AxiosInstance;
  private apiKey: string;
  private environment: 'sandbox' | 'production';

  constructor(config: AsaasConfig) {
    this.apiKey = config.apiKey;
    this.environment = config.environment;

    const baseURL =
      config.environment === 'sandbox'
        ? 'https://sandbox.asaas.com/api/v3'
        : 'https://api.asaas.com/api/v3';

    this.client = axios.create({
      baseURL,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Criar cliente no Asaas
   */
  async createCustomer(data: CreateCustomerRequest): Promise<CreateCustomerResponse> {
    try {
      const response = await this.client.post('/customers', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        cpfCnpj: data.cpfCnpj,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar cliente: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Obter cliente do Asaas
   */
  async getCustomer(customerId: string): Promise<CreateCustomerResponse> {
    try {
      const response = await this.client.get(`/customers/${customerId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter cliente: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Criar cobrança (PIX ou Boleto)
   */
  async createCharge(data: CreateChargeRequest): Promise<CreateChargeResponse> {
    try {
      const response = await this.client.post('/payments', {
        customer: data.customer,
        billingType: data.billingType,
        value: data.value,
        dueDate: data.dueDate,
        description: data.description,
      });

      return response.data;
    } catch (error) {
      throw new Error(`Erro ao criar cobrança: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Obter cobrança
   */
  async getCharge(chargeId: string): Promise<GetChargeResponse> {
    try {
      const response = await this.client.get(`/payments/${chargeId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Erro ao obter cobrança: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Listar cobranças de um cliente
   */
  async listCharges(customerId: string, limit: number = 10): Promise<GetChargeResponse[]> {
    try {
      const response = await this.client.get('/payments', {
        params: {
          customer: customerId,
          limit,
        },
      });

      return response.data.data || [];
    } catch (error) {
      throw new Error(`Erro ao listar cobranças: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Cancelar cobrança
   */
  async cancelCharge(chargeId: string): Promise<void> {
    try {
      await this.client.delete(`/payments/${chargeId}`);
    } catch (error) {
      throw new Error(`Erro ao cancelar cobrança: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Gerar QR Code PIX
   */
  async generatePixQrCode(chargeId: string): Promise<string> {
    try {
      const charge = await this.getCharge(chargeId);

      if (!charge.pixQrCode) {
        throw new Error('QR Code não disponível para esta cobrança');
      }

      return charge.pixQrCode;
    } catch (error) {
      throw new Error(`Erro ao gerar QR Code: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Obter chave PIX (Copia e Cola)
   */
  async getPixCopiaeCola(chargeId: string): Promise<string> {
    try {
      const charge = await this.getCharge(chargeId);

      if (!charge.pixCopiaeCola) {
        throw new Error('Chave PIX não disponível para esta cobrança');
      }

      return charge.pixCopiaeCola;
    } catch (error) {
      throw new Error(`Erro ao obter chave PIX: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Obter código de barras do Boleto
   */
  async getBoletoBarCode(chargeId: string): Promise<string> {
    try {
      const charge = await this.getCharge(chargeId);

      if (!charge.boletoBarCode) {
        throw new Error('Código de barras não disponível para esta cobrança');
      }

      return charge.boletoBarCode;
    } catch (error) {
      throw new Error(`Erro ao obter código de barras: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Obter linha digitável do Boleto
   */
  async getBoletoDigitableLine(chargeId: string): Promise<string> {
    try {
      const charge = await this.getCharge(chargeId);

      if (!charge.boletoDigitableLine) {
        throw new Error('Linha digitável não disponível para esta cobrança');
      }

      return charge.boletoDigitableLine;
    } catch (error) {
      throw new Error(`Erro ao obter linha digitável: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Validar assinatura de webhook
   */
  validateWebhookSignature(body: string, signature: string, webhookSecret: string): boolean {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      return hash === signature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Processar webhook de pagamento
   */
  processPaymentWebhook(data: any) {
    const event = data.event;
    const charge = data.payment;

    switch (event) {
      case 'payment_confirmed':
        return {
          type: 'PAYMENT_CONFIRMED',
          chargeId: charge.id,
          status: 'CONFIRMED',
          paidDate: charge.confirmedDate,
          paidValue: charge.value,
        };

      case 'payment_received':
        return {
          type: 'PAYMENT_RECEIVED',
          chargeId: charge.id,
          status: 'RECEIVED',
          paidDate: charge.receivedDate,
          paidValue: charge.value,
        };

      case 'payment_overdue':
        return {
          type: 'PAYMENT_OVERDUE',
          chargeId: charge.id,
          status: 'OVERDUE',
          dueDate: charge.dueDate,
        };

      case 'payment_deleted':
        return {
          type: 'PAYMENT_DELETED',
          chargeId: charge.id,
          status: 'DELETED',
        };

      default:
        return {
          type: 'UNKNOWN',
          chargeId: charge.id,
        };
    }
  }

  /**
   * Formatar valor para Asaas (centavos)
   */
  formatValue(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Calcular data de vencimento (dias úteis)
   */
  calculateDueDate(daysFromNow: number = 3): string {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);

    // Pular fins de semana
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }

    return date.toISOString().split('T')[0];
  }

  /**
   * Obter mensagem de erro
   */
  private getErrorMessage(error: any): string {
    if (error.response?.data?.errors?.[0]?.description) {
      return error.response.data.errors[0].description;
    }

    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.message) {
      return error.message;
    }

    return 'Erro desconhecido';
  }
}

/**
 * Inicializar serviço Asaas
 */
export function initAsaasService(): AsaasService {
  const apiKey = process.env.ASAAS_API_KEY || '';
  const environment = (process.env.ASAAS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'production';

  if (!apiKey) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  return new AsaasService({
    apiKey,
    environment,
  });
}

export default AsaasService;
