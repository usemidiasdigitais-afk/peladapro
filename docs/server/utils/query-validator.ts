/**
 * Validador de Queries
 * Garante que todas as queries incluem WHERE group_id
 * Previne data leakage entre grupos
 */

export interface QueryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validar que uma query tem filtro group_id
 */
export function validateQueryHasGroupFilter(
  query: any,
  userGroupId: string
): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar se query tem where clause
  if (!query || typeof query !== 'object') {
    errors.push('Query inválida: deve ser um objeto');
    return { isValid: false, errors, warnings };
  }

  // Verificar se tem filtro de grupo
  const hasGroupFilter =
    query.where?.groupId ||
    query.where?.group_id ||
    query.groupId ||
    query.group_id;

  if (!hasGroupFilter) {
    errors.push('Query sem filtro group_id: possível data leakage');
  }

  // Verificar se o group_id corresponde ao do usuário
  const queryGroupId =
    query.where?.groupId?.equals ||
    query.where?.group_id?.equals ||
    query.groupId ||
    query.group_id;

  if (queryGroupId && queryGroupId.toLowerCase() !== userGroupId.toLowerCase()) {
    errors.push(`Group ID mismatch: query tem ${queryGroupId}, usuário tem ${userGroupId}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar que um objeto de dados tem group_id
 */
export function validateDataHasGroupId(data: any, userGroupId: string): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Dados inválidos: deve ser um objeto');
    return { isValid: false, errors, warnings };
  }

  if (!data.groupId && !data.group_id) {
    errors.push('Dados sem group_id');
  }

  const dataGroupId = data.groupId || data.group_id;
  if (dataGroupId && dataGroupId.toLowerCase() !== userGroupId.toLowerCase()) {
    errors.push(`Group ID mismatch: dados têm ${dataGroupId}, usuário tem ${userGroupId}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar que um array de objetos tem group_id
 */
export function validateArrayHasGroupId(
  data: any[],
  userGroupId: string
): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(data)) {
    errors.push('Dados inválidos: deve ser um array');
    return { isValid: false, errors, warnings };
  }

  if (data.length === 0) {
    warnings.push('Array vazio');
    return { isValid: true, errors, warnings };
  }

  // Verificar cada item
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    if (!item.groupId && !item.group_id) {
      errors.push(`Item ${i} sem group_id`);
    }

    const itemGroupId = item.groupId || item.group_id;
    if (itemGroupId && itemGroupId.toLowerCase() !== userGroupId.toLowerCase()) {
      errors.push(
        `Item ${i}: Group ID mismatch: tem ${itemGroupId}, usuário tem ${userGroupId}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar que um ID de recurso pertence ao grupo
 */
export function validateResourceBelongsToGroup(
  resourceId: string,
  resourceGroupId: string | undefined,
  userGroupId: string
): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!resourceId) {
    errors.push('Resource ID não fornecido');
  }

  if (!resourceGroupId) {
    errors.push(`Recurso ${resourceId} não tem group_id`);
  }

  if (
    resourceGroupId &&
    resourceGroupId.toLowerCase() !== userGroupId.toLowerCase()
  ) {
    errors.push(
      `Recurso ${resourceId} pertence a outro grupo: ${resourceGroupId} vs ${userGroupId}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar que um ID de recurso é um UUID válido
 */
export function validateUUID(id: string): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    errors.push(`ID inválido: ${id} não é um UUID válido`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validar múltiplos IDs
 */
export function validateMultipleUUIDs(ids: string[]): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(ids)) {
    errors.push('IDs devem ser um array');
    return { isValid: false, errors, warnings };
  }

  for (const id of ids) {
    const result = validateUUID(id);
    errors.push(...result.errors);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitizar query para remover group_id malicioso
 */
export function sanitizeQuery(query: any, userGroupId: string): any {
  if (!query || typeof query !== 'object') {
    return query;
  }

  const sanitized = { ...query };

  // Remover group_id do query se existir
  if (sanitized.groupId) {
    delete sanitized.groupId;
  }
  if (sanitized.group_id) {
    delete sanitized.group_id;
  }

  // Adicionar group_id correto
  sanitized.where = sanitized.where || {};
  sanitized.where.groupId = {
    equals: userGroupId,
  };

  return sanitized;
}

/**
 * Sanitizar dados para adicionar group_id correto
 */
export function sanitizeData(data: any, userGroupId: string): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sanitized = { ...data };

  // Sempre usar o group_id do usuário
  sanitized.groupId = userGroupId;

  return sanitized;
}

/**
 * Validar que um email pertence ao grupo
 * (Exemplo: validar que email do jogador é do domínio da empresa)
 */
export function validateEmailBelongsToGroup(email: string, groupDomain?: string): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!email || !email.includes('@')) {
    errors.push('Email inválido');
  }

  if (groupDomain) {
    const emailDomain = email.split('@')[1];
    if (emailDomain !== groupDomain) {
      warnings.push(`Email ${email} não pertence ao domínio ${groupDomain}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logar tentativa de acesso não autorizado
 */
export function logSecurityViolation(
  violation: string,
  userId: string,
  groupId: string,
  additionalData?: any
) {
  console.error(`[SECURITY VIOLATION] ${violation}`, {
    userId,
    groupId,
    timestamp: new Date().toISOString(),
    ...additionalData,
  });

  // Aqui você poderia enviar para um serviço de logging externo
  // ou criar um registro em uma tabela de auditoria
}

/**
 * Validar que um payload de webhook é válido
 */
export function validateWebhookPayload(
  payload: any,
  expectedGroupId: string
): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== 'object') {
    errors.push('Webhook payload inválido');
    return { isValid: false, errors, warnings };
  }

  // Verificar se payload tem referência ao grupo
  if (payload.groupId && payload.groupId.toLowerCase() !== expectedGroupId.toLowerCase()) {
    errors.push(`Webhook para grupo diferente: ${payload.groupId} vs ${expectedGroupId}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Criar relatório de validação
 */
export function createValidationReport(
  validations: { name: string; result: QueryValidationResult }[]
): string {
  let report = '=== VALIDATION REPORT ===\n\n';

  let totalValid = 0;
  let totalErrors = 0;

  for (const validation of validations) {
    report += `${validation.name}:\n`;
    report += `  Valid: ${validation.result.isValid}\n`;

    if (validation.result.errors.length > 0) {
      report += `  Errors:\n`;
      for (const error of validation.result.errors) {
        report += `    - ${error}\n`;
      }
      totalErrors += validation.result.errors.length;
    }

    if (validation.result.warnings.length > 0) {
      report += `  Warnings:\n`;
      for (const warning of validation.result.warnings) {
        report += `    - ${warning}\n`;
      }
    }

    report += '\n';

    if (validation.result.isValid) {
      totalValid++;
    }
  }

  report += `\nSummary: ${totalValid}/${validations.length} validations passed\n`;
  report += `Total errors: ${totalErrors}\n`;

  return report;
}
