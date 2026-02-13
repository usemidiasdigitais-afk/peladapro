import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import {
  validateQueryHasGroupFilter,
  validateResourceBelongsToGroup,
  validateUUID,
  sanitizeQuery,
} from '../utils/query-validator';

/**
 * Exemplo de Implementação Segura de Endpoint tRPC
 * Demonstra as melhores práticas de segurança e multi-tenancy
 */

/**
 * Schema de validação
 */
const GetMatchSchema = z.object({
  matchId: z.string().uuid('ID de partida inválido'),
});

const CreateMatchSchema = z.object({
  sport: z.enum(['futebol', 'volei', 'beach_tennis']),
  date: z.string().datetime(),
  location: z.string().min(3).max(255),
  costPerPlayer: z.string().regex(/^\d+(\.\d{2})?$/),
});

const UpdateMatchSchema = CreateMatchSchema.partial().extend({
  matchId: z.string().uuid(),
});

export const secureExampleRouter = router({
  /**
   * ✅ EXEMPLO SEGURO: Obter partida
   * 
   * Implementa:
   * - Autenticação obrigatória
   * - Validação de UUID
   * - Validação de ownership
   * - Logging de acesso
   */
  getMatch: protectedProcedure
    .input(GetMatchSchema)
    .query(async ({ input, ctx }) => {
      try {
        // 1. Validar UUID
        const uuidValidation = validateUUID(input.matchId);
        if (!uuidValidation.isValid) {
          throw new Error(`ID de partida inválido: ${uuidValidation.errors[0]}`);
        }

        // 2. Consultar banco com filtro group_id
        const match = await ctx.db.query.matches.findFirst({
          where: (matches, { eq, and }) =>
            and(
              eq(matches.id, input.matchId),
              eq(matches.groupId, ctx.user.groupId) // ✅ OBRIGATÓRIO
            ),
        });

        // 3. Validar que recurso existe e pertence ao grupo
        if (!match) {
          console.warn(
            `[SECURITY] Tentativa de acesso a partida inexistente ou de outro grupo: ${input.matchId}`,
            {
              userId: ctx.user.userId,
              groupId: ctx.user.groupId,
              timestamp: new Date().toISOString(),
            }
          );
          throw new Error('Partida não encontrada');
        }

        // 4. Validar ownership explicitamente
        const ownershipValidation = validateResourceBelongsToGroup(
          input.matchId,
          match.groupId,
          ctx.user.groupId
        );

        if (!ownershipValidation.isValid) {
          console.error('[SECURITY] Violação de ownership:', {
            userId: ctx.user.userId,
            groupId: ctx.user.groupId,
            resourceGroupId: match.groupId,
            errors: ownershipValidation.errors,
          });
          throw new Error('Acesso negado');
        }

        // 5. Retornar dados
        return {
          success: true,
          data: match,
        };
      } catch (error) {
        console.error('Erro ao obter partida:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao obter partida',
        };
      }
    }),

  /**
   * ✅ EXEMPLO SEGURO: Listar partidas
   * 
   * Implementa:
   * - Filtro obrigatório group_id
   * - Sanitização de query
   * - Paginação segura
   */
  listMatches: protectedProcedure
    .input(
      z.object({
        sport: z.enum(['futebol', 'volei', 'beach_tennis']).optional(),
        limit: z.number().int().min(1).max(100).default(20),
        offset: z.number().int().min(0).default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // 1. Construir query com filtro group_id obrigatório
        const query = {
          where: {
            groupId: {
              equals: ctx.user.groupId, // ✅ OBRIGATÓRIO
            },
            ...(input.sport && { sport: { equals: input.sport } }),
          },
          take: input.limit,
          skip: input.offset,
          orderBy: { createdAt: 'desc' as const },
        };

        // 2. Validar query
        const queryValidation = validateQueryHasGroupFilter(query, ctx.user.groupId);
        if (!queryValidation.isValid) {
          throw new Error(`Query inválida: ${queryValidation.errors[0]}`);
        }

        // 3. Executar query
        const matches = await ctx.db.query.matches.findMany(query);

        // 4. Validar que todos os resultados pertencem ao grupo
        for (const match of matches) {
          const validation = validateResourceBelongsToGroup(
            match.id,
            match.groupId,
            ctx.user.groupId
          );
          if (!validation.isValid) {
            console.error('[SECURITY] Match retornado não pertence ao grupo:', match.id);
            throw new Error('Erro de integridade de dados');
          }
        }

        return {
          success: true,
          data: matches,
          pagination: {
            limit: input.limit,
            offset: input.offset,
            total: matches.length,
          },
        };
      } catch (error) {
        console.error('Erro ao listar partidas:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao listar partidas',
        };
      }
    }),

  /**
   * ✅ EXEMPLO SEGURO: Criar partida
   * 
   * Implementa:
   * - Validação de entrada
   * - Adição automática de group_id
   * - Logging de criação
   */
  createMatch: protectedProcedure
    .input(CreateMatchSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Validar que usuário tem permissão de criar
        if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
          console.warn('[SECURITY] Tentativa de criar partida sem permissão:', {
            userId: ctx.user.userId,
            role: ctx.user.role,
          });
          throw new Error('Permissão negada');
        }

        // 2. Preparar dados com group_id obrigatório
        const matchData = {
          ...input,
          groupId: ctx.user.groupId, // ✅ SEMPRE usar group_id do usuário
          createdBy: ctx.user.userId,
        };

        // 3. Inserir no banco
        const match = await ctx.db.insert('matches').values(matchData);

        // 4. Logar criação
        console.log('[AUDIT] Partida criada:', {
          matchId: match.id,
          groupId: ctx.user.groupId,
          userId: ctx.user.userId,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          data: {
            matchId: match.id,
            groupId: match.groupId,
          },
        };
      } catch (error) {
        console.error('Erro ao criar partida:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao criar partida',
        };
      }
    }),

  /**
   * ✅ EXEMPLO SEGURO: Atualizar partida
   * 
   * Implementa:
   * - Validação de ownership
   * - Proteção de group_id
   * - Logging de mudanças
   */
  updateMatch: protectedProcedure
    .input(UpdateMatchSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Validar permissão
        if (ctx.user.role !== 'ADMIN' && ctx.user.role !== 'SUPER_ADMIN') {
          throw new Error('Permissão negada');
        }

        // 2. Validar UUID
        const uuidValidation = validateUUID(input.matchId);
        if (!uuidValidation.isValid) {
          throw new Error('ID de partida inválido');
        }

        // 3. Obter partida atual
        const currentMatch = await ctx.db.query.matches.findFirst({
          where: (matches, { eq, and }) =>
            and(
              eq(matches.id, input.matchId),
              eq(matches.groupId, ctx.user.groupId) // ✅ OBRIGATÓRIO
            ),
        });

        if (!currentMatch) {
          throw new Error('Partida não encontrada');
        }

        // 4. Preparar dados para atualização
        const updateData = {
          sport: input.sport,
          date: input.date,
          location: input.location,
          costPerPlayer: input.costPerPlayer,
          updatedAt: new Date(),
          // ✅ NUNCA permitir atualização de group_id
          // groupId é imutável
        };

        // 5. Atualizar no banco
        await ctx.db
          .update('matches')
          .set(updateData)
          .where((matches, { eq, and }) =>
            and(
              eq(matches.id, input.matchId),
              eq(matches.groupId, ctx.user.groupId) // ✅ OBRIGATÓRIO
            )
          );

        // 6. Logar atualização
        console.log('[AUDIT] Partida atualizada:', {
          matchId: input.matchId,
          groupId: ctx.user.groupId,
          userId: ctx.user.userId,
          changes: Object.keys(updateData),
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          message: 'Partida atualizada com sucesso',
        };
      } catch (error) {
        console.error('Erro ao atualizar partida:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao atualizar partida',
        };
      }
    }),

  /**
   * ✅ EXEMPLO SEGURO: Deletar partida
   * 
   * Implementa:
   * - Validação de ownership
   * - Soft delete para auditoria
   * - Logging de deleção
   */
  deleteMatch: protectedProcedure
    .input(z.object({ matchId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      try {
        // 1. Validar permissão (apenas SUPER_ADMIN pode deletar)
        if (ctx.user.role !== 'SUPER_ADMIN') {
          throw new Error('Apenas super admin pode deletar partidas');
        }

        // 2. Validar ownership
        const match = await ctx.db.query.matches.findFirst({
          where: (matches, { eq, and }) =>
            and(
              eq(matches.id, input.matchId),
              eq(matches.groupId, ctx.user.groupId) // ✅ OBRIGATÓRIO
            ),
        });

        if (!match) {
          throw new Error('Partida não encontrada');
        }

        // 3. Soft delete
        await ctx.db
          .update('matches')
          .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where((matches, { eq, and }) =>
            and(
              eq(matches.id, input.matchId),
              eq(matches.groupId, ctx.user.groupId) // ✅ OBRIGATÓRIO
            )
          );

        // 4. Logar deleção
        console.log('[AUDIT] Partida deletada:', {
          matchId: input.matchId,
          groupId: ctx.user.groupId,
          userId: ctx.user.userId,
          timestamp: new Date().toISOString(),
        });

        return {
          success: true,
          message: 'Partida deletada com sucesso',
        };
      } catch (error) {
        console.error('Erro ao deletar partida:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Erro ao deletar partida',
        };
      }
    }),
});

/**
 * 📋 Checklist para Implementar Endpoint Seguro:
 * 
 * - [ ] Autenticação obrigatória (protectedProcedure)
 * - [ ] Validação de entrada (Zod schema)
 * - [ ] Validação de UUID
 * - [ ] Filtro WHERE group_id em todas as queries
 * - [ ] Validação de ownership explícita
 * - [ ] Validação de role/permissões
 * - [ ] Nunca permitir atualização de group_id
 * - [ ] Usar soft delete (adicionar deletedAt)
 * - [ ] Logar todas as operações (AUDIT)
 * - [ ] Logar tentativas de acesso negado (SECURITY)
 * - [ ] Tratamento de erros sem expor detalhes internos
 * - [ ] Testes de segurança (cross-group access)
 */
