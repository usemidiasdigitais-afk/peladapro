import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Multi-tenancy
 * Garante que cada usuário só acessa dados do seu grupo
 */

/**
 * Interface para requisição com validação de grupo
 */
export interface TenantRequest extends Request {
  groupId?: string;
  userId?: string;
  userRole?: string;
}

/**
 * Middleware para validar group_id em requisições
 * Extrai group_id do JWT e valida acesso
 */
export function multiTenancyMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  try {
    // group_id deve estar no JWT (adicionado pelo authMiddleware)
    const groupId = req.groupId;
    const userId = req.userId;

    if (!groupId) {
      return res.status(401).json({
        error: 'Acesso negado: group_id não encontrado',
        code: 'MISSING_GROUP_ID',
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Acesso negado: userId não encontrado',
        code: 'MISSING_USER_ID',
      });
    }

    // Validar formato de UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(groupId)) {
      return res.status(400).json({
        error: 'Acesso negado: group_id inválido',
        code: 'INVALID_GROUP_ID',
      });
    }

    // Armazenar no request para uso posterior
    req.groupId = groupId;
    req.userId = userId;

    next();
  } catch (error) {
    return res.status(500).json({
      error: 'Erro ao validar multi-tenancy',
      code: 'MULTI_TENANCY_ERROR',
    });
  }
}

/**
 * Middleware para validar acesso a recurso específico
 * Verifica se o recurso pertence ao grupo do usuário
 */
export function validateResourceAccess(
  resourceGroupId: string | undefined,
  userGroupId: string
): boolean {
  if (!resourceGroupId) {
    return false;
  }

  // Comparação case-insensitive de UUIDs
  return resourceGroupId.toLowerCase() === userGroupId.toLowerCase();
}

/**
 * Middleware para validar acesso a múltiplos recursos
 */
export function validateMultipleResourceAccess(
  resourceGroupIds: (string | undefined)[],
  userGroupId: string
): boolean {
  return resourceGroupIds.every((id) => validateResourceAccess(id, userGroupId));
}

/**
 * Validar que um ID de recurso pertence ao grupo
 * Útil para proteger contra URL manipulation
 */
export function validateResourceOwnership(
  resourceId: string,
  userGroupId: string,
  resourceGroupId: string | undefined
): boolean {
  if (!resourceGroupId) {
    console.warn(`[SECURITY] Tentativa de acesso a recurso sem group_id: ${resourceId}`);
    return false;
  }

  if (resourceGroupId.toLowerCase() !== userGroupId.toLowerCase()) {
    console.warn(
      `[SECURITY] Tentativa de acesso cruzado: usuário ${userGroupId} tentou acessar recurso de ${resourceGroupId}`
    );
    return false;
  }

  return true;
}

/**
 * Middleware para proteger rotas de admin
 * Verifica se o usuário tem role de ADMIN ou SUPER_ADMIN
 */
export function requireAdminRole(req: TenantRequest, res: Response, next: NextFunction) {
  const userRole = req.userRole;

  if (!userRole || (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN')) {
    return res.status(403).json({
      error: 'Acesso negado: permissão de admin requerida',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }

  next();
}

/**
 * Middleware para proteger rotas de super admin
 */
export function requireSuperAdminRole(req: TenantRequest, res: Response, next: NextFunction) {
  const userRole = req.userRole;

  if (userRole !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Acesso negado: permissão de super admin requerida',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }

  next();
}

/**
 * Middleware para validar que query parameters não contêm group_id malicioso
 * Protege contra tentativas de manipulação de URL
 */
export function validateQueryParameters(req: TenantRequest, res: Response, next: NextFunction) {
  const userGroupId = req.groupId;
  const queryGroupId = req.query.group_id as string | undefined;

  // Se query contém group_id, deve ser igual ao do usuário
  if (queryGroupId && queryGroupId.toLowerCase() !== userGroupId?.toLowerCase()) {
    console.warn(
      `[SECURITY] Tentativa de manipulação de query parameter group_id: ${queryGroupId}`
    );
    return res.status(403).json({
      error: 'Acesso negado: group_id inválido',
      code: 'INVALID_GROUP_ID',
    });
  }

  next();
}

/**
 * Middleware para validar que body parameters não contêm group_id malicioso
 */
export function validateBodyParameters(req: TenantRequest, res: Response, next: NextFunction) {
  const userGroupId = req.groupId;
  const bodyGroupId = req.body?.group_id as string | undefined;

  // Se body contém group_id, deve ser igual ao do usuário
  if (bodyGroupId && bodyGroupId.toLowerCase() !== userGroupId?.toLowerCase()) {
    console.warn(
      `[SECURITY] Tentativa de manipulação de body parameter group_id: ${bodyGroupId}`
    );
    return res.status(403).json({
      error: 'Acesso negado: group_id inválido',
      code: 'INVALID_GROUP_ID',
    });
  }

  next();
}

/**
 * Middleware para validar path parameters
 * Exemplo: /matches/:matchId
 */
export function validatePathParameters(paramName: string) {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    const userGroupId = req.groupId;
    const resourceId = req.params[paramName];

    if (!resourceId) {
      return res.status(400).json({
        error: `Parâmetro ${paramName} obrigatório`,
        code: 'MISSING_PARAMETER',
      });
    }

    // Validar formato de UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(resourceId)) {
      return res.status(400).json({
        error: `Parâmetro ${paramName} inválido`,
        code: 'INVALID_PARAMETER',
      });
    }

    // Aqui você faria uma query no banco para validar ownership
    // Por enquanto, apenas validamos o formato
    next();
  };
}

/**
 * Middleware para logar tentativas de acesso não autorizado
 */
export function auditAccessAttempts(req: TenantRequest, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (data: any) {
    const statusCode = res.statusCode;

    // Logar tentativas de acesso negado
    if (statusCode === 403 || statusCode === 401) {
      console.warn(`[AUDIT] Acesso negado: ${req.method} ${req.path}`, {
        userId: req.userId,
        groupId: req.groupId,
        statusCode,
        timestamp: new Date().toISOString(),
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Função auxiliar para criar filtro WHERE group_id
 * Garante que todas as queries filtrem por group_id
 */
export function createGroupFilter(groupId: string) {
  return {
    groupId: {
      equals: groupId,
    },
  };
}

/**
 * Função auxiliar para validar que um objeto tem group_id
 */
export function ensureGroupId(obj: any, userGroupId: string): boolean {
  if (!obj || !obj.groupId) {
    return false;
  }

  return obj.groupId.toLowerCase() === userGroupId.toLowerCase();
}

/**
 * Middleware para adicionar group_id automaticamente a requisições
 * Protege contra tentativas de contornar a validação
 */
export function enforceGroupId(req: TenantRequest, res: Response, next: NextFunction) {
  const userGroupId = req.groupId;

  // Adicionar group_id ao body se não existir
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.body) {
      req.body = {};
    }

    // Sempre usar o group_id do usuário, ignorar qualquer valor no body
    req.body.groupId = userGroupId;
  }

  next();
}
