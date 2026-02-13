import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

interface SecureAPIOptions {
  baseURL?: string;
  timeout?: number;
}

interface RequestConfig extends AxiosRequestConfig {
  groupId?: string;
  validateGroupId?: boolean;
}

class SecureAPIClient {
  private client: AxiosInstance;
  private currentGroupId: string | null = null;
  private currentToken: string | null = null;

  constructor(options: SecureAPIOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseURL || 'http://localhost:3000/api',
      timeout: options.timeout || 30000,
    });

    // Interceptor para adicionar token e group_id
    this.client.interceptors.request.use(
      (config) => {
        if (this.currentToken) {
          config.headers.Authorization = `Bearer ${this.currentToken}`;
        }
        if (this.currentGroupId) {
          config.headers['X-Group-ID'] = this.currentGroupId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para tratar erros de autenticação
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado
          this.currentToken = null;
          // Redirecionar para login
        }
        if (error.response?.status === 403) {
          // Acesso negado (multi-tenancy violation)
          console.error('Multi-tenancy violation:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  }

  // Definir contexto de autenticação
  setAuthContext(token: string, groupId: string) {
    this.currentToken = token;
    this.currentGroupId = groupId;
  }

  // Limpar contexto
  clearAuthContext() {
    this.currentToken = null;
    this.currentGroupId = null;
  }

  // GET com validação de group_id
  async get<T = any>(url: string, config?: RequestConfig): Promise<T> {
    this.validateGroupId(config);
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  // POST com validação de group_id
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    this.validateGroupId(config);
    
    // Adicionar group_id aos dados se não existir
    if (data && !data.groupId && this.currentGroupId) {
      data.groupId = this.currentGroupId;
    }

    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  // PUT com validação de group_id
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    this.validateGroupId(config);
    
    if (data && !data.groupId && this.currentGroupId) {
      data.groupId = this.currentGroupId;
    }

    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  // DELETE com validação de group_id
  async delete<T = any>(url: string, config?: RequestConfig): Promise<T> {
    this.validateGroupId(config);
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Validar group_id
  private validateGroupId(config?: RequestConfig) {
    if (config?.validateGroupId !== false && !this.currentGroupId) {
      throw new Error('Multi-tenancy: No group_id in authentication context');
    }

    if (config?.groupId && config.groupId !== this.currentGroupId) {
      throw new Error('Multi-tenancy: Attempted access to different group');
    }
  }
}

// Instância singleton
let apiClientInstance: SecureAPIClient | null = null;

export function getSecureAPIClient(): SecureAPIClient {
  if (!apiClientInstance) {
    apiClientInstance = new SecureAPIClient();
  }
  return apiClientInstance;
}

export function initializeSecureAPI(token: string, groupId: string) {
  const client = getSecureAPIClient();
  client.setAuthContext(token, groupId);
}

export function clearSecureAPI() {
  const client = getSecureAPIClient();
  client.clearAuthContext();
}
