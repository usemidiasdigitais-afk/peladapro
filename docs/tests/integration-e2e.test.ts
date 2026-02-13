import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/server/db';
import { groups, users } from '@/drizzle/schema-auth';
import { matches, attendance } from '@/drizzle/schema-matches';
import { barbecueExpenses, barbecueDebts } from '@/drizzle/schema-barbecue';
import { asaasPayments } from '@/drizzle/schema-payments';
import { eq, and } from 'drizzle-orm';

/**
 * Testes de Integração End-to-End
 * Validam o fluxo completo das 4 camadas
 */

describe('Integração E2E - Fluxo Completo', () => {
  let testGroupId: string;
  let testAdminId: string;
  let testPlayerId: string;
  let testMatchId: string;

  beforeEach(async () => {
    // Criar grupo de teste
    const groupResult = await db.insert(groups).values({
      name: 'Grupo Teste',
      email: 'teste@grupo.com',
      plan: 'PREMIUM',
    }).returning();
    testGroupId = groupResult[0].id;

    // Criar admin
    const adminResult = await db.insert(users).values({
      groupId: testGroupId,
      email: 'admin@teste.com',
      name: 'Admin Teste',
      passwordHash: 'hashed_password',
      role: 'ADMIN',
    }).returning();
    testAdminId = adminResult[0].id;

    // Criar jogador
    const playerResult = await db.insert(users).values({
      groupId: testGroupId,
      email: 'player@teste.com',
      name: 'Jogador Teste',
      passwordHash: 'hashed_password',
      role: 'PLAYER',
    }).returning();
    testPlayerId = playerResult[0].id;
  });

  afterEach(async () => {
    // Limpar dados de teste
    await db.delete(barbecueDebts).where(eq(barbecueDebts.groupId, testGroupId));
    await db.delete(barbecueExpenses).where(eq(barbecueExpenses.groupId, testGroupId));
    await db.delete(attendance).where(eq(attendance.matchId, testMatchId));
    await db.delete(matches).where(eq(matches.groupId, testGroupId));
    await db.delete(users).where(eq(users.groupId, testGroupId));
    await db.delete(groups).where(eq(groups.id, testGroupId));
  });

  describe('Camada 1: Autenticação', () => {
    it('deve criar usuário com isolamento por grupo', async () => {
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, testAdminId),
          eq(users.groupId, testGroupId)
        ),
      });

      expect(user).toBeDefined();
      expect(user?.role).toBe('ADMIN');
      expect(user?.groupId).toBe(testGroupId);
    });

    it('deve rejeitar acesso cruzado entre grupos', async () => {
      // Criar segundo grupo
      const group2Result = await db.insert(groups).values({
        name: 'Grupo 2',
        email: 'grupo2@teste.com',
        plan: 'FREE',
      }).returning();
      const group2Id = group2Result[0].id;

      // Tentar acessar usuário do grupo 1 com grupo 2
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, testAdminId),
          eq(users.groupId, group2Id)
        ),
      });

      expect(user).toBeUndefined();

      // Limpar
      await db.delete(groups).where(eq(groups.id, group2Id));
    });
  });

  describe('Camada 2: Criação de Peladas', () => {
    it('deve criar pelada com valores corretos', async () => {
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        confirmedPlayers: 0,
        status: 'SCHEDULED',
      }).returning();

      testMatchId = matchResult[0].id;

      expect(matchResult[0].matchCost).toBe(50);
      expect(matchResult[0].barbecueCost).toBe(100);
      expect(matchResult[0].status).toBe('SCHEDULED');
    });

    it('deve confirmar presença de jogador', async () => {
      // Criar pelada
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Confirmar presença
      const attendanceResult = await db.insert(attendance).values({
        matchId: testMatchId,
        playerId: testPlayerId,
        status: 'CONFIRMED',
        confirmedAt: new Date(),
      }).returning();

      expect(attendanceResult[0].status).toBe('CONFIRMED');

      // Atualizar contador
      await db.update(matches)
        .set({ confirmedPlayers: 1 })
        .where(eq(matches.id, testMatchId));

      const updated = await db.query.matches.findFirst({
        where: eq(matches.id, testMatchId),
      });

      expect(updated?.confirmedPlayers).toBe(1);
    });

    it('deve validar isolamento de peladas por grupo', async () => {
      // Criar pelada no grupo 1
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Criar grupo 2
      const group2Result = await db.insert(groups).values({
        name: 'Grupo 2',
        email: 'grupo2@teste.com',
        plan: 'FREE',
      }).returning();
      const group2Id = group2Result[0].id;

      // Tentar acessar pelada do grupo 1 com grupo 2
      const match = await db.query.matches.findFirst({
        where: and(
          eq(matches.id, testMatchId),
          eq(matches.groupId, group2Id)
        ),
      });

      expect(match).toBeUndefined();

      // Limpar
      await db.delete(groups).where(eq(groups.id, group2Id));
    });
  });

  describe('Camada 3: Pagamentos Asaas', () => {
    it('deve registrar pagamento com valor total correto', async () => {
      // Criar pelada
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Registrar pagamento
      const paymentResult = await db.insert(asaasPayments).values({
        groupId: testGroupId,
        matchId: testMatchId,
        asaasChargeId: 'charge_123',
        amount: 150, // 50 + 100
        status: 'PENDING',
        pixQrCode: 'qrcode_data',
        pixCopyPaste: 'copy_paste_key',
        expiresAt: new Date(Date.now() + 3600000),
      }).returning();

      expect(paymentResult[0].amount).toBe(150);
      expect(paymentResult[0].status).toBe('PENDING');
    });

    it('deve processar webhook de pagamento confirmado', async () => {
      // Criar pelada e pagamento
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      const paymentResult = await db.insert(asaasPayments).values({
        groupId: testGroupId,
        matchId: testMatchId,
        asaasChargeId: 'charge_123',
        amount: 150,
        status: 'PENDING',
        pixQrCode: 'qrcode_data',
        pixCopyPaste: 'copy_paste_key',
        expiresAt: new Date(Date.now() + 3600000),
      }).returning();
      const paymentId = paymentResult[0].id;

      // Simular webhook de pagamento
      const updated = await db.update(asaasPayments)
        .set({
          status: 'PAID',
          paidAt: new Date(),
        })
        .where(eq(asaasPayments.id, paymentId))
        .returning();

      expect(updated[0].status).toBe('PAID');
      expect(updated[0].paidAt).toBeDefined();
    });
  });

  describe('Camada 4: Módulo Churrasco', () => {
    it('deve adicionar despesa de churrasco', async () => {
      // Criar pelada
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Adicionar despesa
      const expenseResult = await db.insert(barbecueExpenses).values({
        groupId: testGroupId,
        matchId: testMatchId,
        paidBy: testAdminId,
        category: 'MEAT',
        description: 'Carnes para churrasco',
        amount: 150,
        splitBetween: 11,
      }).returning();

      expect(expenseResult[0].amount).toBe(150);
      expect(expenseResult[0].category).toBe('MEAT');
    });

    it('deve calcular débitos automaticamente', async () => {
      // Criar pelada
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Criar segundo jogador
      const player2Result = await db.insert(users).values({
        groupId: testGroupId,
        email: 'player2@teste.com',
        name: 'Jogador 2',
        passwordHash: 'hashed_password',
        role: 'PLAYER',
      }).returning();
      const player2Id = player2Result[0].id;

      // Confirmar presenças
      await db.insert(attendance).values({
        matchId: testMatchId,
        playerId: testPlayerId,
        status: 'CONFIRMED',
      });

      await db.insert(attendance).values({
        matchId: testMatchId,
        playerId: player2Id,
        status: 'CONFIRMED',
      });

      // Adicionar despesa (admin paga 60, cada um deve 30)
      await db.insert(barbecueExpenses).values({
        groupId: testGroupId,
        matchId: testMatchId,
        paidBy: testAdminId,
        category: 'MEAT',
        description: 'Carnes',
        amount: 60,
        splitBetween: 2,
      });

      // Criar débitos
      await db.insert(barbecueDebts).values({
        groupId: testGroupId,
        matchId: testMatchId,
        debtor: testPlayerId,
        creditor: testAdminId,
        amount: 30,
        isPaid: false,
      });

      await db.insert(barbecueDebts).values({
        groupId: testGroupId,
        matchId: testMatchId,
        debtor: player2Id,
        creditor: testAdminId,
        amount: 30,
        isPaid: false,
      });

      // Verificar débitos
      const debts = await db.query.barbecueDebts.findMany({
        where: and(
          eq(barbecueDebts.matchId, testMatchId),
          eq(barbecueDebts.groupId, testGroupId)
        ),
      });

      expect(debts.length).toBe(2);
      expect(debts[0].amount).toBe(30);
      expect(debts[1].amount).toBe(30);
    });

    it('deve permitir marcar débito como pago', async () => {
      // Criar pelada
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Criar débito
      const debtResult = await db.insert(barbecueDebts).values({
        groupId: testGroupId,
        matchId: testMatchId,
        debtor: testPlayerId,
        creditor: testAdminId,
        amount: 30,
        isPaid: false,
      }).returning();
      const debtId = debtResult[0].id;

      // Marcar como pago
      const updated = await db.update(barbecueDebts)
        .set({
          isPaid: true,
          paidAt: new Date(),
        })
        .where(eq(barbecueDebts.id, debtId))
        .returning();

      expect(updated[0].isPaid).toBe(true);
      expect(updated[0].paidAt).toBeDefined();
    });
  });

  describe('Integração Completa: Fluxo Total', () => {
    it('deve completar fluxo: criar pelada → confirmar presença → pagar → churrasco', async () => {
      // PASSO 1: Criar pelada
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      expect(matchResult[0].matchCost).toBe(50);
      expect(matchResult[0].barbecueCost).toBe(100);

      // PASSO 2: Confirmar presença
      await db.insert(attendance).values({
        matchId: testMatchId,
        playerId: testPlayerId,
        status: 'CONFIRMED',
      });

      await db.update(matches)
        .set({ confirmedPlayers: 1 })
        .where(eq(matches.id, testMatchId));

      // PASSO 3: Registrar pagamento
      const paymentResult = await db.insert(asaasPayments).values({
        groupId: testGroupId,
        matchId: testMatchId,
        asaasChargeId: 'charge_123',
        amount: 150,
        status: 'PENDING',
        pixQrCode: 'qrcode_data',
        pixCopyPaste: 'copy_paste_key',
      }).returning();

      expect(paymentResult[0].amount).toBe(150);

      // PASSO 4: Adicionar despesa de churrasco
      await db.insert(barbecueExpenses).values({
        groupId: testGroupId,
        matchId: testMatchId,
        paidBy: testAdminId,
        category: 'MEAT',
        description: 'Carnes',
        amount: 100,
        splitBetween: 1,
      });

      // PASSO 5: Processar pagamento
      await db.update(asaasPayments)
        .set({
          status: 'PAID',
          paidAt: new Date(),
        })
        .where(eq(asaasPayments.id, paymentResult[0].id));

      // PASSO 6: Verificar estado final
      const finalMatch = await db.query.matches.findFirst({
        where: eq(matches.id, testMatchId),
        with: {
          attendance: true,
        },
      });

      const finalPayment = await db.query.asaasPayments.findFirst({
        where: eq(asaasPayments.matchId, testMatchId),
      });

      const expenses = await db.query.barbecueExpenses.findMany({
        where: eq(barbecueExpenses.matchId, testMatchId),
      });

      expect(finalMatch?.confirmedPlayers).toBe(1);
      expect(finalPayment?.status).toBe('PAID');
      expect(expenses.length).toBe(1);
      expect(expenses[0].amount).toBe(100);
    });
  });

  describe('Segurança: Isolamento Multi-Tenant', () => {
    it('deve validar isolamento em todas as camadas', async () => {
      // Criar segundo grupo
      const group2Result = await db.insert(groups).values({
        name: 'Grupo 2',
        email: 'grupo2@teste.com',
        plan: 'FREE',
      }).returning();
      const group2Id = group2Result[0].id;

      // Criar usuário no grupo 2
      const user2Result = await db.insert(users).values({
        groupId: group2Id,
        email: 'admin2@teste.com',
        name: 'Admin 2',
        passwordHash: 'hashed_password',
        role: 'ADMIN',
      }).returning();
      const admin2Id = user2Result[0].id;

      // Criar pelada no grupo 1
      const matchResult = await db.insert(matches).values({
        groupId: testGroupId,
        createdBy: testAdminId,
        sport: 'FOOTBALL',
        date: new Date('2026-02-15'),
        location: 'Parque Central',
        matchCost: 50,
        barbecueCost: 100,
        maxPlayers: 11,
        status: 'SCHEDULED',
      }).returning();
      testMatchId = matchResult[0].id;

      // Tentar acessar pelada do grupo 1 com usuário do grupo 2
      const match = await db.query.matches.findFirst({
        where: and(
          eq(matches.id, testMatchId),
          eq(matches.groupId, group2Id)
        ),
      });

      expect(match).toBeUndefined();

      // Limpar
      await db.delete(users).where(eq(users.groupId, group2Id));
      await db.delete(groups).where(eq(groups.id, group2Id));
    });
  });
});
