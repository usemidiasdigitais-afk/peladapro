import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token JWT
    this.client.interceptors.request.use(async (config) => {
      const token = await AsyncStorage.getItem('@pelada_pro_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expirado - fazer logout
          AsyncStorage.removeItem('@pelada_pro_token');
          AsyncStorage.removeItem('@pelada_pro_user');
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async signup(email: string, password: string, name: string, role: string) {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      name,
      role,
    });
    return response.data;
  }

  // Match endpoints
  async getMatches(groupId?: string) {
    const response = await this.client.get('/matches', {
      params: { groupId },
    });
    return response.data;
  }

  async getMatch(matchId: string) {
    const response = await this.client.get(`/matches/${matchId}`);
    return response.data;
  }

  async createMatch(data: any) {
    const response = await this.client.post('/matches', data);
    return response.data;
  }

  async updateMatch(matchId: string, data: any) {
    const response = await this.client.put(`/matches/${matchId}`, data);
    return response.data;
  }

  async deleteMatch(matchId: string) {
    const response = await this.client.delete(`/matches/${matchId}`);
    return response.data;
  }

  // Player endpoints
  async getPlayers(groupId?: string) {
    const response = await this.client.get('/players', {
      params: { groupId },
    });
    return response.data;
  }

  async getPlayer(playerId: string) {
    const response = await this.client.get(`/players/${playerId}`);
    return response.data;
  }

  async updatePlayer(playerId: string, data: any) {
    const response = await this.client.put(`/players/${playerId}`, data);
    return response.data;
  }

  // Match Presence endpoints
  async confirmPresence(matchId: string) {
    const response = await this.client.post(`/matches/${matchId}/confirm-presence`);
    return response.data;
  }

  async cancelPresence(matchId: string) {
    const response = await this.client.post(`/matches/${matchId}/cancel-presence`);
    return response.data;
  }

  async getMatchPresence(matchId: string) {
    const response = await this.client.get(`/matches/${matchId}/presence`);
    return response.data;
  }

  // Payment endpoints
  async generatePixCharge(matchId: string, amount: number) {
    const response = await this.client.post('/payments/generate-pix', {
      matchId,
      amount,
    });
    return response.data;
  }

  async getPaymentStatus(paymentId: string) {
    const response = await this.client.get(`/payments/${paymentId}/status`);
    return response.data;
  }

  async confirmPayment(paymentId: string) {
    const response = await this.client.post(`/payments/${paymentId}/confirm`);
    return response.data;
  }

  async getPlayerPayments(playerId: string) {
    const response = await this.client.get(`/players/${playerId}/payments`);
    return response.data;
  }

  // Group endpoints
  async getGroups() {
    const response = await this.client.get('/groups');
    return response.data;
  }

  async getGroup(groupId: string) {
    const response = await this.client.get(`/groups/${groupId}`);
    return response.data;
  }

  async createGroup(data: any) {
    const response = await this.client.post('/groups', data);
    return response.data;
  }

  async updateGroup(groupId: string, data: any) {
    const response = await this.client.put(`/groups/${groupId}`, data);
    return response.data;
  }

  async joinGroup(groupId: string) {
    const response = await this.client.post(`/groups/${groupId}/join`);
    return response.data;
  }

  async leaveGroup(groupId: string) {
    const response = await this.client.post(`/groups/${groupId}/leave`);
    return response.data;
  }

  // Invite endpoints
  async sendInvite(groupId: string, email: string) {
    const response = await this.client.post(`/groups/${groupId}/invite`, { email });
    return response.data;
  }

  async acceptInvite(inviteId: string) {
    const response = await this.client.post(`/invites/${inviteId}/accept`);
    return response.data;
  }

  async rejectInvite(inviteId: string) {
    const response = await this.client.post(`/invites/${inviteId}/reject`);
    return response.data;
  }

  // Sorter endpoints
  async generateTeams(matchId: string) {
    const response = await this.client.post(`/matches/${matchId}/generate-teams`);
    return response.data;
  }

  async getTeams(matchId: string) {
    const response = await this.client.get(`/matches/${matchId}/teams`);
    return response.data;
  }
}

export const apiClient = new APIClient();
