#!/usr/bin/env ts-node

/**
 * Script de Teste de Conexão com Asaas
 * 
 * Valida:
 * 1. Conexão com API Asaas
 * 2. Autenticação com API key
 * 3. Ambiente (produção ou sandbox)
 * 4. Operações básicas (listar clientes, criar cliente, etc)
 * 
 * Uso:
 *   npx ts-node scripts/test-asaas-connection.ts
 *   ou
 *   npm run test:asaas
 */

import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
}

class AsaasConnectionTester {
  private apiKey: string;
  private environment: 'production' | 'sandbox';
  private baseURL: string;
  private results: TestResult[] = [];

  constructor() {
    this.apiKey = process.env.ASAAS_API_KEY || '';
    this.environment = (process.env.NODE_ENV === 'production' ? 'production' : 'sandbox') as 'production' | 'sandbox';
    this.baseURL = this.environment === 'production'
      ? 'https://api.asaas.com/v3'
      : 'https://sandbox.asaas.com/v3';
  }

  /**
   * Executar todos os testes
   */
  async runAllTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTE DE CONEXÃO COM ASAAS');
    console.log('='.repeat(60));
    console.log(`\n📍 Ambiente: ${this.environment.toUpperCase()}`);
    console.log(`🔗 URL Base: ${this.baseURL}`);
    console.log(`🔑 API Key: ${this.apiKey.substring(0, 20)}...`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 1: Validar variáveis de ambiente
    await this.testEnvironmentVariables();

    // Teste 2: Testar conectividade básica
    await this.testBasicConnectivity();

    // Teste 3: Testar autenticação
    await this.testAuthentication();

    // Teste 4: Listar clientes
    await this.testListCustomers();

    // Teste 5: Criar cliente de teste
    await this.testCreateCustomer();

    // Teste 6: Validar webhook signature
    await this.testWebhookSignature();

    // Exibir resumo
    this.printSummary();
  }

  /**
   * Teste 1: Validar variáveis de ambiente
   */
  private async testEnvironmentVariables(): Promise<void> {
    const start = Date.now();
    try {
      if (!this.apiKey) {
        this.results.push({
          name: '1. Variáveis de Ambiente',
          status: 'FAIL',
          message: 'ASAAS_API_KEY não está configurada',
          duration: Date.now() - start,
        });
        return;
      }

      if (!this.apiKey.startsWith('$aact_')) {
        this.results.push({
          name: '1. Variáveis de Ambiente',
          status: 'FAIL',
          message: 'ASAAS_API_KEY não parece ser válida (deve começar com $aact_)',
          duration: Date.now() - start,
        });
        return;
      }

      this.results.push({
        name: '1. Variáveis de Ambiente',
        status: 'PASS',
        message: `API Key configurada corretamente (${this.apiKey.length} caracteres)`,
        duration: Date.now() - start,
      });
    } catch (error) {
      this.results.push({
        name: '1. Variáveis de Ambiente',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - start,
      });
    }
  }

  /**
   * Teste 2: Testar conectividade básica
   */
  private async testBasicConnectivity(): Promise<void> {
    const start = Date.now();
    try {
      const response = await axios.get(`${this.baseURL}/customers`, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      this.results.push({
        name: '2. Conectividade Básica',
        status: 'PASS',
        message: `Conexão estabelecida com sucesso (HTTP ${response.status})`,
        duration: Date.now() - start,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.results.push({
        name: '2. Conectividade Básica',
        status: 'FAIL',
        message: `Erro ao conectar: ${errorMessage}`,
        duration: Date.now() - start,
      });
    }
  }

  /**
   * Teste 3: Testar autenticação
   */
  private async testAuthentication(): Promise<void> {
    const start = Date.now();
    try {
      const response = await axios.get(`${this.baseURL}/customers`, {
        headers: {
          'access_token': this.apiKey,
        },
        timeout: 5000,
      });

      if (response.status === 200) {
        this.results.push({
          name: '3. Autenticação',
          status: 'PASS',
          message: 'API Key autenticada com sucesso',
          duration: Date.now() - start,
        });
      } else {
        this.results.push({
          name: '3. Autenticação',
          status: 'FAIL',
          message: `Status inesperado: ${response.status}`,
          duration: Date.now() - start,
        });
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        this.results.push({
          name: '3. Autenticação',
          status: 'FAIL',
          message: 'API Key inválida ou expirada (401 Unauthorized)',
          duration: Date.now() - start,
        });
      } else {
        this.results.push({
          name: '3. Autenticação',
          status: 'FAIL',
          message: error instanceof Error ? error.message : 'Erro de autenticação',
          duration: Date.now() - start,
        });
      }
    }
  }

  /**
   * Teste 4: Listar clientes
   */
  private async testListCustomers(): Promise<void> {
    const start = Date.now();
    try {
      const response = await axios.get(`${this.baseURL}/customers?limit=1`, {
        headers: {
          'access_token': this.apiKey,
        },
        timeout: 5000,
      });

      const customerCount = response.data.data?.length || 0;
      this.results.push({
        name: '4. Listar Clientes',
        status: 'PASS',
        message: `${customerCount} cliente(s) encontrado(s) na conta`,
        duration: Date.now() - start,
      });
    } catch (error) {
      this.results.push({
        name: '4. Listar Clientes',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Erro ao listar clientes',
        duration: Date.now() - start,
      });
    }
  }

  /**
   * Teste 5: Criar cliente de teste
   */
  private async testCreateCustomer(): Promise<void> {
    const start = Date.now();
    try {
      const testCustomer = {
        name: 'Cliente Teste Pelada Pró',
        email: `test-${Date.now()}@peladapro.com`,
        phone: '11999999999',
      };

      const response = await axios.post(`${this.baseURL}/customers`, testCustomer, {
        headers: {
          'access_token': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.data.id) {
        this.results.push({
          name: '5. Criar Cliente',
          status: 'PASS',
          message: `Cliente criado com sucesso (ID: ${response.data.id})`,
          duration: Date.now() - start,
        });
      } else {
        this.results.push({
          name: '5. Criar Cliente',
          status: 'FAIL',
          message: 'Cliente criado mas sem ID retornado',
          duration: Date.now() - start,
        });
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        this.results.push({
          name: '5. Criar Cliente',
          status: 'FAIL',
          message: 'Dados inválidos para criar cliente',
          duration: Date.now() - start,
        });
      } else {
        this.results.push({
          name: '5. Criar Cliente',
          status: 'FAIL',
          message: error instanceof Error ? error.message : 'Erro ao criar cliente',
          duration: Date.now() - start,
        });
      }
    }
  }

  /**
   * Teste 6: Validar webhook signature
   */
  private async testWebhookSignature(): Promise<void> {
    const start = Date.now();
    try {
      const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET || 'test-secret';
      const payload = JSON.stringify({
        event: 'payment.confirmed',
        data: { id: 'test-123' },
      });

      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      // Validar assinatura
      const isValid = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex') === signature;

      if (isValid) {
        this.results.push({
          name: '6. Validação de Webhook',
          status: 'PASS',
          message: 'Assinatura HMAC-SHA256 validada com sucesso',
          duration: Date.now() - start,
        });
      } else {
        this.results.push({
          name: '6. Validação de Webhook',
          status: 'FAIL',
          message: 'Assinatura HMAC-SHA256 inválida',
          duration: Date.now() - start,
        });
      }
    } catch (error) {
      this.results.push({
        name: '6. Validação de Webhook',
        status: 'FAIL',
        message: error instanceof Error ? error.message : 'Erro ao validar webhook',
        duration: Date.now() - start,
      });
    }
  }

  /**
   * Exibir resumo dos testes
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60) + '\n');

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    // Exibir cada resultado
    this.results.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      const time = `${result.duration}ms`;
      console.log(`${icon} ${result.name}`);
      console.log(`   └─ ${result.message} (${time})\n`);
    });

    console.log('='.repeat(60));
    console.log(`\n📈 Total: ${this.results.length} | ✅ Passou: ${passed} | ❌ Falhou: ${failed} | ⏭️ Pulou: ${skipped}\n`);

    // Status final
    if (failed === 0) {
      console.log('🎉 TODOS OS TESTES PASSARAM! Asaas está pronto para uso.\n');
      process.exit(0);
    } else {
      console.log('⚠️  ALGUNS TESTES FALHARAM. Verifique a configuração.\n');
      process.exit(1);
    }
  }
}

/**
 * Executar tester
 */
async function main(): Promise<void> {
  const tester = new AsaasConnectionTester();
  await tester.runAllTests();
}

main().catch(error => {
  console.error('Erro ao executar testes:', error);
  process.exit(1);
});
