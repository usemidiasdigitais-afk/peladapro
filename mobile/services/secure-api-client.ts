import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SecureRequestConfig extends AxiosRequestConfig {
  groupId?: string; // Multi-tenancy: validar group_id
  requireAuth?: boolean; // Requer autenticação
  requireRole?: 'SUPER_ADMIN' | 'ADMIN' | 'PLAYER'; // Role mínima requerida
}

/**
 * Cliente HTTP seguro com validação de multi-tenancy
 */
export class SecureAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;

    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de requisição
    this.client.interceptors.request.use(
      async (config) => {
        // Adicionar token de autenticação
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const parsedToken = JSON.parse(token);
          config.headers.Authorization = `Bearer ${parsedToken.accessToken}`;
        }

        // Adicionar group_id se fornecido
        const customConfig = config as SecureRequestConfig;
        if (customConfig.groupId) {
          config.headers['X-Group-ID'] = customConfig.groupId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de resposta
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Tratar erro 401 (não autenticado)
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('user');
          await AsyncStorage.removeItem('token');
          // TODO: Redirecionar para login
        }

        // Tratar erro 403 (não autorizado)
        if (error.response?.status === 403) {
          console.error('Acesso negado: você não tem permissão para acessar este recurso');
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET com validação de multi-tenancy
   */
  async get<T>(
    url: string,
    config?: SecureRequestConfig
  ): Promise<T> {
    try {
      await this.validateRequest(config);
      const response = await this.client.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST com validação de multi-tenancy
   */
  async post<T>(
    url: string,
    data?: any,
    config?: SecureRequestConfig
  ): Promise<T> {
    try {
      await this.validateRequest(config);
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT com validação de multi-tenancy
   */
  async put<T>(
    url: string,
    data?: any,
    config?: SecureRequestConfig
  ): Promise<T> {
    try {
      await this.validateRequest(config);
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE com validação de multi-tenancy
   */
  async delete<T>(
    url: string,
    config?: SecureRequestConfig
  ): Promise<T> {
    try {
      await this.validateRequest(config);
      const response = await this.client.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Validar requisição
   */
  private async validateRequest(config?: SecureRequestConfig): Promise<void> {
    // Validar autenticação
    if (config?.requireAuth !== false) {
      const user = await AsyncStorage.getItem('user');
      if (!user) {
        throw new Error('Não autenticado. Faça login para continuar.');
      }
    }

    // Validar group_id
    if (config?.groupId) {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);

        // Super admin pode acessar qualquer grupo
        if (parsedUser.role === 'SUPER_ADMIN') {
          return;
        }

        // Outros usuários só podem acessar seu próprio grupo
        if (parsedUser.groupId !== config.groupId) {
          throw new Error('Acesso negado: você não tem permissão para acessar este grupo');
        }
      }
    }

    // Validar role
    if (config?.requireRole) {
      const user = await AsyncStorage.getItem('user');
      if (user) {
        const parsedUser = JSON.parse(user);

        const roleHierarchy: { [key: string]: number } = {
          SUPER_ADMIN: 3,
          ADMIN: 2,
          PLAYER: 1,
        };

        if (roleHierarchy[parsedUser.role] < roleHierarchy[config.requireRole]) {
          throw new Error(
            `Acesso negado: você precisa ser ${config.requireRole} para acessar este recurso`
          );
        }
      }
    }
  }

  /**
   * Tratar erro
   */
  private handleError(error: any): Error {
    if (error.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error.message) {
      return new Error(error.message);
    }

    return new Error('Erro desconhecido');
  }

  /**
   * Obter usuário autenticado
   */
  async getCurrentUser() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Obter group_id do usuário autenticado
   */
  async getUserGroupId(): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user?.groupId) {
      throw new Error('Usuário não autenticado ou sem grupo');
    }
    return user.groupId;
  }
}

/**
 * Instância global do cliente
 */
let apiClient: SecureAPIClient | null = null;

export function initSecureAPIClient(baseURL?: string): SecureAPIClient {
  if (!apiClient) {
    apiClient = new SecureAPIClient(baseURL);
  }
  return apiClient;
}

export function getSecureAPIClient(): SecureAPIClient {
  if (!apiClient) {
    apiClient = new SecureAPIClient();
  }
  return apiClient;
}

export default SecureAPIClient;
