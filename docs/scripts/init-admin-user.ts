#!/usr/bin/env ts-node

/**
 * Script de Inicialização - Criar Usuário Admin
 * 
 * Cria:
 * 1. Grupo "Pelada Pró Master"
 * 2. Usuário ADMIN com email usemidiasdigitais@gmail.com
 * 3. Senha segura com bcrypt
 * 
 * Uso:
 *   npx ts-node scripts/init-admin-user.ts
 *   ou
 *   npm run init:admin
 */

import * as bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Carregar variáveis de ambiente
dotenv.config();

interface InitResult {
  success: boolean;
  groupId?: string;
  userId?: string;
  credentials?: {
    email: string;
    password: string;
    groupName: string;
  };
  error?: string;
}

class AdminUserInitializer {
  private supabase: ReturnType<typeof createClient>;
  private email = 'usemidiasdigitais@gmail.com';
  private groupName = 'Pelada Pró Master';
  private password = 'Pelada@2026'; // Senha inicial (deve ser alterada)

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL e SUPABASE_KEY não configuradas');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Executar inicialização completa
   */
  async initialize(): Promise<InitResult> {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 INICIALIZAÇÃO DE USUÁRIO ADMIN');
    console.log('='.repeat(60) + '\n');

    try {
      // Passo 1: Criar Grupo
      console.log('📍 Passo 1: Criando grupo...');
      const groupId = await this.createGroup();
      console.log(`✅ Grupo criado: ${groupId}\n`);

      // Passo 2: Gerar hash de senha
      console.log('🔐 Passo 2: Gerando hash de senha...');
      const passwordHash = await this.hashPassword(this.password);
      console.log(`✅ Hash gerado: ${passwordHash.substring(0, 20)}...\n`);

      // Passo 3: Criar Usuário
      console.log('👤 Passo 3: Criando usuário ADMIN...');
      const userId = await this.createUser(groupId, passwordHash);
      console.log(`✅ Usuário criado: ${userId}\n`);

      // Passo 4: Exibir Credenciais
      console.log('='.repeat(60));
      console.log('✅ INICIALIZAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('='.repeat(60) + '\n');

      this.displayCredentials(groupId, userId);

      return {
        success: true,
        groupId,
        userId,
        credentials: {
          email: this.email,
          password: this.password,
          groupName: this.groupName,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`\n❌ Erro: ${errorMessage}\n`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Criar Grupo
   */
  private async createGroup(): Promise<string> {
    const groupId = uuidv4();

    const { data, error } = await this.supabase
      .from('groups')
      .insert({
        id: groupId,
        name: this.groupName,
        email: this.email,
        plan: 'PREMIUM',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar grupo: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Gerar hash de senha com bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Criar Usuário
   */
  private async createUser(groupId: string, passwordHash: string): Promise<string> {
    const userId = uuidv4();

    const { data, error } = await this.supabase
      .from('users')
      .insert({
        id: userId,
        group_id: groupId,
        email: this.email,
        name: 'Admin Master',
        password_hash: passwordHash,
        role: 'ADMIN',
        phone: '11999999999',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar usuário: ${error.message}`);
    }

    return data.id;
  }

  /**
   * Exibir credenciais de login
   */
  private displayCredentials(groupId: string, userId: string): void {
    console.log('📋 CREDENCIAIS DE LOGIN');
    console.log('-'.repeat(60));
    console.log(`\n📧 Email:           ${this.email}`);
    console.log(`🔑 Senha:           ${this.password}`);
    console.log(`👥 Grupo:           ${this.groupName}`);
    console.log(`🆔 Group ID:        ${groupId}`);
    console.log(`👤 User ID:         ${userId}`);
    console.log(`📊 Role:            ADMIN`);
    console.log(`📱 Plano:           PREMIUM`);
    console.log('\n' + '-'.repeat(60));

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   1. Altere a senha após o primeiro login');
    console.log('   2. Guarde essas credenciais em local seguro');
    console.log('   3. Não compartilhe a senha com ninguém');
    console.log('   4. Use HTTPS em produção\n');

    console.log('🧪 TESTAR LOGIN:');
    console.log(`   curl -X POST http://localhost:3000/api/auth/login \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"email":"${this.email}","password":"${this.password}"}'`);
    console.log('\n' + '='.repeat(60) + '\n');
  }
}

/**
 * Executar inicializador
 */
async function main(): Promise<void> {
  try {
    const initializer = new AdminUserInitializer();
    const result = await initializer.initialize();

    if (!result.success) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Erro fatal:', error);
    process.exit(1);
  }
}

main();
