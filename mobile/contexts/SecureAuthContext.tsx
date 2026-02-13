import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  groupId: string; // Multi-tenancy: cada usuário pertence a um grupo
  groupName: string;
  createdAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: AuthToken | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  hasPermission: (requiredRole: UserRole) => boolean;
  canAccessGroup: (groupId: string) => boolean;
  canAccessResource: (resourceGroupId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SecureAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<AuthToken | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sessão ao iniciar
  useEffect(() => {
    restoreSession();
  }, []);

  const restoreSession = async () => {
    try {
      const [storedUser, storedToken] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('token'),
      ]);

      if (storedUser && storedToken) {
        const parsedUser = JSON.parse(storedUser);
        const parsedToken = JSON.parse(storedToken);

        // Validar se token não expirou
        if (new Date(parsedToken.expiresAt) > new Date()) {
          setUser(parsedUser);
          setToken(parsedToken);
        } else {
          // Token expirado, tentar renovar
          await refreshToken();
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar sessão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // TODO: Integrar com backend
      // const response = await apiClient.post('/auth/login', { email, password });

      // Mock login
      const mockUser: User = {
        id: 'user-1',
        email,
        name: 'João Silva',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Pelada do Domingo',
        createdAt: new Date().toISOString(),
      };

      const mockToken: AuthToken = {
        accessToken: `token-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Salvar no AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(mockUser)),
        AsyncStorage.setItem('token', JSON.stringify(mockToken)),
      ]);

      setUser(mockUser);
      setToken(mockToken);
    } catch (error) {
      throw new Error('Falha ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    try {
      setIsLoading(true);

      // TODO: Integrar com backend
      // const response = await apiClient.post('/auth/signup', {
      //   email,
      //   password,
      //   name,
      //   role,
      // });

      // Mock signup
      const mockUser: User = {
        id: `user-${Date.now()}`,
        email,
        name,
        role,
        groupId: `group-${Date.now()}`,
        groupName: 'Novo Grupo',
        createdAt: new Date().toISOString(),
      };

      const mockToken: AuthToken = {
        accessToken: `token-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // Salvar no AsyncStorage
      await Promise.all([
        AsyncStorage.setItem('user', JSON.stringify(mockUser)),
        AsyncStorage.setItem('token', JSON.stringify(mockToken)),
      ]);

      setUser(mockUser);
      setToken(mockToken);
    } catch (error) {
      throw new Error('Falha ao criar conta');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // TODO: Integrar com backend para invalidar token
      // await apiClient.post('/auth/logout');

      // Limpar AsyncStorage
      await Promise.all([
        AsyncStorage.removeItem('user'),
        AsyncStorage.removeItem('token'),
      ]);

      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      if (!token?.refreshToken) {
        throw new Error('Sem refresh token');
      }

      // TODO: Integrar com backend
      // const response = await apiClient.post('/auth/refresh', {
      //   refreshToken: token.refreshToken,
      // });

      // Mock refresh
      const newToken: AuthToken = {
        accessToken: `token-${Date.now()}`,
        refreshToken: `refresh-${Date.now()}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('token', JSON.stringify(newToken));
      setToken(newToken);
    } catch (error) {
      // Se refresh falhar, fazer logout
      await logout();
      throw error;
    }
  };

  /**
   * Verificar se usuário tem permissão baseado em role
   */
  const hasPermission = (requiredRole: UserRole): boolean => {
    if (!user) return false;

    const roleHierarchy: { [key in UserRole]: number } = {
      SUPER_ADMIN: 3,
      ADMIN: 2,
      PLAYER: 1,
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  /**
   * Verificar se usuário pode acessar um grupo específico
   * Multi-tenancy: usuário só pode acessar seu próprio grupo
   */
  const canAccessGroup = (groupId: string): boolean => {
    if (!user) return false;

    // Super admin pode acessar qualquer grupo
    if (user.role === 'SUPER_ADMIN') return true;

    // Admin e players só podem acessar seu próprio grupo
    return user.groupId === groupId;
  };

  /**
   * Verificar se usuário pode acessar um recurso específico
   * Valida que o recurso pertence ao grupo do usuário
   */
  const canAccessResource = (resourceGroupId: string): boolean => {
    if (!user) return false;

    // Super admin pode acessar qualquer recurso
    if (user.role === 'SUPER_ADMIN') return true;

    // Outros usuários só podem acessar recursos do seu grupo
    return user.groupId === resourceGroupId;
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    signup,
    logout,
    refreshToken,
    hasPermission,
    canAccessGroup,
    canAccessResource,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook para usar contexto de autenticação
 */
export function useSecureAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSecureAuth deve ser usado dentro de SecureAuthProvider');
  }
  return context;
}

/**
 * Hook para verificar permissão
 */
export function usePermission(requiredRole: UserRole): boolean {
  const { hasPermission } = useSecureAuth();
  return hasPermission(requiredRole);
}

/**
 * Hook para verificar acesso a grupo
 */
export function useGroupAccess(groupId: string): boolean {
  const { canAccessGroup } = useSecureAuth();
  return canAccessGroup(groupId);
}

/**
 * Hook para verificar acesso a recurso
 */
export function useResourceAccess(resourceGroupId: string): boolean {
  const { canAccessResource } = useSecureAuth();
  return canAccessResource(resourceGroupId);
}

export default SecureAuthProvider;
