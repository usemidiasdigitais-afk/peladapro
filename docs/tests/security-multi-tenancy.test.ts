import { describe, it, expect, beforeEach } from 'vitest';
import {
  validateQueryHasGroupFilter,
  validateDataHasGroupId,
  validateArrayHasGroupId,
  validateResourceBelongsToGroup,
  validateUUID,
  validateMultipleUUIDs,
  sanitizeQuery,
  sanitizeData,
  validateEmailBelongsToGroup,
  validateWebhookPayload,
  createValidationReport,
} from '../server/utils/query-validator';

/**
 * Testes de Segurança - Multi-tenancy
 * Garante isolamento completo entre grupos
 */

describe('Multi-tenancy Security', () => {
  const userGroupId = '550e8400-e29b-41d4-a716-446655440000';
  const otherGroupId = '660e8400-e29b-41d4-a716-446655440001';

  describe('Query Validation', () => {
    it('deve aceitar query com filtro group_id correto', () => {
      const query = {
        where: {
          groupId: {
            equals: userGroupId,
          },
        },
      };

      const result = validateQueryHasGroupFilter(query, userGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar query sem filtro group_id', () => {
      const query = {
        where: {
          name: 'Test',
        },
      };

      const result = validateQueryHasGroupFilter(query, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('group_id');
    });

    it('deve rejeitar query com group_id diferente', () => {
      const query = {
        where: {
          groupId: {
            equals: otherGroupId,
          },
        },
      };

      const result = validateQueryHasGroupFilter(query, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve aceitar query com group_id em formato alternativo', () => {
      const query = {
        where: {
          group_id: {
            equals: userGroupId,
          },
        },
      };

      const result = validateQueryHasGroupFilter(query, userGroupId);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('deve aceitar dados com group_id correto', () => {
      const data = {
        groupId: userGroupId,
        name: 'Test',
        email: 'test@example.com',
      };

      const result = validateDataHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar dados sem group_id', () => {
      const data = {
        name: 'Test',
        email: 'test@example.com',
      };

      const result = validateDataHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar dados com group_id diferente', () => {
      const data = {
        groupId: otherGroupId,
        name: 'Test',
      };

      const result = validateDataHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Array Validation', () => {
    it('deve aceitar array com todos os items tendo group_id correto', () => {
      const data = [
        { groupId: userGroupId, name: 'Item 1' },
        { groupId: userGroupId, name: 'Item 2' },
        { groupId: userGroupId, name: 'Item 3' },
      ];

      const result = validateArrayHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar array com item sem group_id', () => {
      const data = [
        { groupId: userGroupId, name: 'Item 1' },
        { name: 'Item 2' }, // Falta group_id
        { groupId: userGroupId, name: 'Item 3' },
      ];

      const result = validateArrayHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar array com item de outro grupo', () => {
      const data = [
        { groupId: userGroupId, name: 'Item 1' },
        { groupId: otherGroupId, name: 'Item 2' }, // Outro grupo
        { groupId: userGroupId, name: 'Item 3' },
      ];

      const result = validateArrayHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve aceitar array vazio', () => {
      const data: any[] = [];

      const result = validateArrayHasGroupId(data, userGroupId);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Resource Ownership Validation', () => {
    it('deve aceitar recurso que pertence ao grupo', () => {
      const resourceId = '770e8400-e29b-41d4-a716-446655440002';

      const result = validateResourceBelongsToGroup(resourceId, userGroupId, userGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar recurso de outro grupo', () => {
      const resourceId = '770e8400-e29b-41d4-a716-446655440002';

      const result = validateResourceBelongsToGroup(resourceId, otherGroupId, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar recurso sem group_id', () => {
      const resourceId = '770e8400-e29b-41d4-a716-446655440002';

      const result = validateResourceBelongsToGroup(resourceId, undefined, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('UUID Validation', () => {
    it('deve aceitar UUID válido', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';

      const result = validateUUID(id);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar UUID inválido', () => {
      const id = 'invalid-uuid';

      const result = validateUUID(id);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve rejeitar string vazia', () => {
      const id = '';

      const result = validateUUID(id);

      expect(result.isValid).toBe(false);
    });

    it('deve aceitar UUID em maiúsculas', () => {
      const id = '550E8400-E29B-41D4-A716-446655440000';

      const result = validateUUID(id);

      expect(result.isValid).toBe(true);
    });
  });

  describe('Multiple UUIDs Validation', () => {
    it('deve aceitar múltiplos UUIDs válidos', () => {
      const ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '660e8400-e29b-41d4-a716-446655440001',
        '770e8400-e29b-41d4-a716-446655440002',
      ];

      const result = validateMultipleUUIDs(ids);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar se um UUID for inválido', () => {
      const ids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'invalid-uuid',
        '770e8400-e29b-41d4-a716-446655440002',
      ];

      const result = validateMultipleUUIDs(ids);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Query Sanitization', () => {
    it('deve remover group_id malicioso e adicionar correto', () => {
      const query = {
        where: {
          groupId: {
            equals: otherGroupId, // Tentativa de acesso cruzado
          },
          name: 'Test',
        },
      };

      const sanitized = sanitizeQuery(query, userGroupId);

      expect(sanitized.where.groupId.equals).toBe(userGroupId);
      expect(sanitized.where.name).toBe('Test');
    });

    it('deve adicionar group_id se não existir', () => {
      const query = {
        where: {
          name: 'Test',
        },
      };

      const sanitized = sanitizeQuery(query, userGroupId);

      expect(sanitized.where.groupId.equals).toBe(userGroupId);
    });
  });

  describe('Data Sanitization', () => {
    it('deve sempre usar group_id do usuário', () => {
      const data = {
        groupId: otherGroupId, // Tentativa de contornar
        name: 'Test',
        email: 'test@example.com',
      };

      const sanitized = sanitizeData(data, userGroupId);

      expect(sanitized.groupId).toBe(userGroupId);
      expect(sanitized.name).toBe('Test');
      expect(sanitized.email).toBe('test@example.com');
    });
  });

  describe('Email Validation', () => {
    it('deve aceitar email válido', () => {
      const email = 'user@example.com';

      const result = validateEmailBelongsToGroup(email);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar email inválido', () => {
      const email = 'invalid-email';

      const result = validateEmailBelongsToGroup(email);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('deve avisar se email não pertence ao domínio do grupo', () => {
      const email = 'user@example.com';
      const groupDomain = 'company.com';

      const result = validateEmailBelongsToGroup(email, groupDomain);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('Webhook Validation', () => {
    it('deve aceitar webhook com group_id correto', () => {
      const payload = {
        event: 'payment.confirmed',
        groupId: userGroupId,
        data: { id: 'charge-123' },
      };

      const result = validateWebhookPayload(payload, userGroupId);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('deve rejeitar webhook de outro grupo', () => {
      const payload = {
        event: 'payment.confirmed',
        groupId: otherGroupId,
        data: { id: 'charge-123' },
      };

      const result = validateWebhookPayload(payload, userGroupId);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Report', () => {
    it('deve gerar relatório de validação', () => {
      const validations = [
        {
          name: 'Query 1',
          result: validateQueryHasGroupFilter(
            { where: { groupId: { equals: userGroupId } } },
            userGroupId
          ),
        },
        {
          name: 'Data 1',
          result: validateDataHasGroupId({ groupId: userGroupId }, userGroupId),
        },
      ];

      const report = createValidationReport(validations);

      expect(report).toContain('VALIDATION REPORT');
      expect(report).toContain('Query 1');
      expect(report).toContain('Data 1');
      expect(report).toContain('Summary');
    });
  });

  describe('Case-insensitive UUID Comparison', () => {
    it('deve comparar UUIDs case-insensitively', () => {
      const lowerUUID = '550e8400-e29b-41d4-a716-446655440000';
      const upperUUID = '550E8400-E29B-41D4-A716-446655440000';

      const result = validateResourceBelongsToGroup('resource-1', lowerUUID, upperUUID);

      expect(result.isValid).toBe(true);
    });
  });

  describe('SQL Injection Prevention', () => {
    it('deve rejeitar query com SQL injection attempt', () => {
      const maliciousQuery = {
        where: {
          groupId: {
            equals: "' OR '1'='1",
          },
        },
      };

      const result = validateQueryHasGroupFilter(maliciousQuery, userGroupId);

      expect(result.isValid).toBe(false);
    });

    it('deve rejeitar dados com SQL injection attempt', () => {
      const maliciousData = {
        groupId: "' OR '1'='1",
        name: 'Test',
      };

      const result = validateDataHasGroupId(maliciousData, userGroupId);

      expect(result.isValid).toBe(false);
    });
  });

  describe('Cross-group Access Prevention', () => {
    it('deve detectar tentativa de acesso a recurso de outro grupo', () => {
      const resourceId = 'match-123';
      const resourceGroupId = otherGroupId;
      const userGroupId2 = userGroupId;

      const result = validateResourceBelongsToGroup(
        resourceId,
        resourceGroupId,
        userGroupId2
      );

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('outro grupo');
    });
  });
});
