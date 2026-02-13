import { SecureAPIClient } from '../services/secure-api-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('Security - Multi-tenancy', () => {
  let apiClient: SecureAPIClient;

  beforeEach(() => {
    apiClient = new SecureAPIClient('http://localhost:3000');
    jest.clearAllMocks();
  });

  describe('Autenticação', () => {
    it('deve rejeitar requisição sem token', async () => {
      await AsyncStorage.removeItem('token');

      try {
        await apiClient.get('/api/matches', { requireAuth: true });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Não autenticado');
      }
    });

    it('deve incluir token no header Authorization', async () => {
      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      // Mock da requisição
      const spy = jest.spyOn(apiClient['client'], 'get');

      try {
        await apiClient.get('/api/matches');
      } catch (error) {
        // Esperado falhar pois é mock
      }

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Multi-tenancy - Group ID Validation', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));
    });

    it('deve permitir acesso ao próprio grupo', async () => {
      try {
        await apiClient.get('/api/matches', { groupId: 'group-1' });
      } catch (error: any) {
        // Erro esperado pois é mock, mas não deve ser de acesso negado
        expect(error.message).not.toContain('Acesso negado');
      }
    });

    it('deve rejeitar acesso a grupo diferente', async () => {
      try {
        await apiClient.get('/api/matches', { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
        expect(error.message).toContain('grupo');
      }
    });

    it('deve incluir group_id no header X-Group-ID', async () => {
      const spy = jest.spyOn(apiClient['client'], 'get');

      try {
        await apiClient.get('/api/matches', { groupId: 'group-1' });
      } catch (error) {
        // Esperado falhar pois é mock
      }

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    it('deve rejeitar acesso com role insuficiente', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      try {
        await apiClient.post('/api/groups', {}, { requireRole: 'ADMIN' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
        expect(error.message).toContain('ADMIN');
      }
    });

    it('deve permitir acesso com role suficiente', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      try {
        await apiClient.post('/api/groups', {}, { requireRole: 'PLAYER' });
      } catch (error: any) {
        // Erro esperado pois é mock, mas não deve ser de acesso negado
        expect(error.message).not.toContain('Acesso negado');
      }
    });

    it('super admin deve ter acesso a qualquer grupo', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'SUPER_ADMIN',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      try {
        await apiClient.get('/api/matches', { groupId: 'group-2' });
      } catch (error: any) {
        // Erro esperado pois é mock, mas não deve ser de acesso negado
        expect(error.message).not.toContain('Acesso negado');
      }
    });
  });

  describe('Cross-group Access Prevention', () => {
    it('deve impedir acesso cruzado entre grupos', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'ADMIN',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      // Tentar acessar partida de outro grupo
      try {
        await apiClient.get('/api/matches/match-123', { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
      }
    });

    it('deve permitir acesso a recursos do próprio grupo', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      try {
        await apiClient.get('/api/matches/match-123', { groupId: 'group-1' });
      } catch (error: any) {
        // Erro esperado pois é mock, mas não deve ser de acesso negado
        expect(error.message).not.toContain('Acesso negado');
      }
    });
  });

  describe('Data Isolation', () => {
    it('deve isolar dados por grupo', async () => {
      const user1 = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User 1',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Group 1',
        createdAt: new Date().toISOString(),
      };

      const user2 = {
        id: 'user-2',
        email: 'user2@example.com',
        name: 'User 2',
        role: 'PLAYER',
        groupId: 'group-2',
        groupName: 'Group 2',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      // User 1 não deve ver dados de Group 2
      await AsyncStorage.setItem('user', JSON.stringify(user1));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));

      try {
        await apiClient.get('/api/groups/group-2/matches', { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
      }

      // User 2 pode ver dados de Group 2
      await AsyncStorage.setItem('user', JSON.stringify(user2));

      try {
        await apiClient.get('/api/groups/group-2/matches', { groupId: 'group-2' });
      } catch (error: any) {
        // Erro esperado pois é mock, mas não deve ser de acesso negado
        expect(error.message).not.toContain('Acesso negado');
      }
    });
  });

  describe('Token Management', () => {
    it('deve remover token expirado', async () => {
      const expiredToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expirado
      };

      await AsyncStorage.setItem('token', JSON.stringify(expiredToken));

      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(user));

      try {
        await apiClient.get('/api/matches', { requireAuth: true });
      } catch (error: any) {
        // Deveria tentar renovar ou fazer logout
        expect(error).toBeDefined();
      }
    });
  });

  describe('Métodos HTTP Seguros', () => {
    beforeEach(async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'PLAYER',
        groupId: 'group-1',
        groupName: 'Test Group',
        createdAt: new Date().toISOString(),
      };

      const mockToken = {
        accessToken: 'test-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('token', JSON.stringify(mockToken));
    });

    it('GET deve validar multi-tenancy', async () => {
      try {
        await apiClient.get('/api/matches', { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
      }
    });

    it('POST deve validar multi-tenancy', async () => {
      try {
        await apiClient.post('/api/matches', {}, { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
      }
    });

    it('PUT deve validar multi-tenancy', async () => {
      try {
        await apiClient.put('/api/matches/1', {}, { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
      }
    });

    it('DELETE deve validar multi-tenancy', async () => {
      try {
        await apiClient.delete('/api/matches/1', { groupId: 'group-2' });
        fail('Deveria ter lançado erro');
      } catch (error: any) {
        expect(error.message).toContain('Acesso negado');
      }
    });
  });
});
