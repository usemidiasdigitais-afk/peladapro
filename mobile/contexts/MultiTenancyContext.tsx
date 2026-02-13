import React, { createContext, useContext, useCallback } from 'react';
import { useSecureAuth } from './SecureAuthContext';

interface MultiTenancyContextType {
  validateGroupAccess: (groupId: string) => boolean;
  getCurrentGroupId: () => string | null;
  filterByGroupId: <T extends { groupId: string }>(items: T[]) => T[];
  ensureGroupIdFilter: (query: any) => any;
}

const MultiTenancyContext = createContext<MultiTenancyContextType | undefined>(undefined);

export function MultiTenancyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSecureAuth();

  // Validar se o usuário tem acesso ao grupo
  const validateGroupAccess = useCallback((groupId: string): boolean => {
    if (!user) return false;
    
    // Super admin tem acesso a todos os grupos
    if (user.role === 'SUPER_ADMIN') return true;
    
    // Admin e jogadores só têm acesso ao seu grupo
    return user.groupId === groupId;
  }, [user]);

  // Obter grupo atual do usuário
  const getCurrentGroupId = useCallback((): string | null => {
    return user?.groupId || null;
  }, [user]);

  // Filtrar itens pelo group_id
  const filterByGroupId = useCallback(<T extends { groupId: string }>(items: T[]): T[] => {
    const groupId = getCurrentGroupId();
    if (!groupId) return [];
    
    return items.filter(item => item.groupId === groupId);
  }, [getCurrentGroupId]);

  // Garantir que toda query tenha filtro de group_id
  const ensureGroupIdFilter = useCallback((query: any): any => {
    const groupId = getCurrentGroupId();
    if (!groupId) {
      throw new Error('Multi-tenancy: No group_id found in user context');
    }

    // Se a query já tem filtro de group_id, validar
    if (query.where && query.where.groupId) {
      if (query.where.groupId !== groupId && user?.role !== 'SUPER_ADMIN') {
        throw new Error('Multi-tenancy: Access denied - group_id mismatch');
      }
    } else {
      // Adicionar filtro de group_id se não existir
      query.where = query.where || {};
      query.where.groupId = groupId;
    }

    return query;
  }, [getCurrentGroupId, user?.role]);

  const value: MultiTenancyContextType = {
    validateGroupAccess,
    getCurrentGroupId,
    filterByGroupId,
    ensureGroupIdFilter,
  };

  return (
    <MultiTenancyContext.Provider value={value}>
      {children}
    </MultiTenancyContext.Provider>
  );
}

export function useMultiTenancy() {
  const context = useContext(MultiTenancyContext);
  if (!context) {
    throw new Error('useMultiTenancy must be used within MultiTenancyProvider');
  }
  return context;
}
