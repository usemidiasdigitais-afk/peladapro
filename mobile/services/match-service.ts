import { getSecureAPIClient } from './secure-api';
import { useMultiTenancy } from '@/contexts/MultiTenancyContext';

export interface CreateMatchRequest {
  groupId: string;
  title: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
  dateTime: string; // ISO 8601
  maxPlayers: number;
  maxGoalkeepers: number;
  financialConfig: {
    enabled: boolean;
    amount?: number; // em centavos
    splitBarbecue?: boolean;
    paymentRequired?: boolean; // Asaas
  };
}

export interface Match {
  id: string;
  groupId: string;
  title: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dateTime: string;
  maxPlayers: number;
  maxGoalkeepers: number;
  confirmedPlayers: number;
  confirmedGoalkeepers: number;
  financialConfig: {
    enabled: boolean;
    amount?: number;
    splitBarbecue?: boolean;
    paymentRequired?: boolean;
  };
  inviteLink: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'FINISHED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLink {
  id: string;
  matchId: string;
  groupId: string;
  token: string;
  link: string;
  createdAt: string;
  expiresAt: string;
  usedCount: number;
}

class MatchService {
  /**
   * Criar nova pelada
   */
  async createMatch(request: CreateMatchRequest): Promise<Match> {
    const api = getSecureAPIClient();

    try {
      const match = await api.post<Match>('/matches', {
        groupId: request.groupId,
        title: request.title,
        location: request.location,
        dateTime: request.dateTime,
        maxPlayers: request.maxPlayers,
        maxGoalkeepers: request.maxGoalkeepers,
        financialConfig: request.financialConfig,
      });

      return match;
    } catch (error: any) {
      throw new Error(`Erro ao criar pelada: ${error.message}`);
    }
  }

  /**
   * Gerar link mágico de convite
   */
  async generateInviteLink(matchId: string, groupId: string): Promise<InviteLink> {
    const api = getSecureAPIClient();

    try {
      const inviteLink = await api.post<InviteLink>(`/matches/${matchId}/invite-link`, {
        groupId,
      });

      return inviteLink;
    } catch (error: any) {
      throw new Error(`Erro ao gerar link de convite: ${error.message}`);
    }
  }

  /**
   * Obter pelada por ID (com validação de group_id)
   */
  async getMatch(matchId: string, groupId: string): Promise<Match> {
    const api = getSecureAPIClient();

    try {
      const match = await api.get<Match>(`/matches/${matchId}`, {
        groupId,
      });

      return match;
    } catch (error: any) {
      throw new Error(`Erro ao obter pelada: ${error.message}`);
    }
  }

  /**
   * Listar peladas do grupo
   */
  async listMatches(groupId: string, filters?: any): Promise<Match[]> {
    const api = getSecureAPIClient();

    try {
      const matches = await api.get<Match[]>('/matches', {
        groupId,
      });

      return matches;
    } catch (error: any) {
      throw new Error(`Erro ao listar peladas: ${error.message}`);
    }
  }

  /**
   * Confirmar presença em pelada
   */
  async confirmPresence(matchId: string, groupId: string, position: 'PLAYER' | 'GOALKEEPER'): Promise<void> {
    const api = getSecureAPIClient();

    try {
      await api.post(`/matches/${matchId}/confirm-presence`, {
        groupId,
        position,
      });
    } catch (error: any) {
      throw new Error(`Erro ao confirmar presença: ${error.message}`);
    }
  }

  /**
   * Cancelar presença em pelada
   */
  async cancelPresence(matchId: string, groupId: string): Promise<void> {
    const api = getSecureAPIClient();

    try {
      await api.post(`/matches/${matchId}/cancel-presence`, {
        groupId,
      });
    } catch (error: any) {
      throw new Error(`Erro ao cancelar presença: ${error.message}`);
    }
  }

  /**
   * Usar link de convite (jogador entra na pelada)
   */
  async useInviteLink(token: string): Promise<Match> {
    const api = getSecureAPIClient();

    try {
      const match = await api.post<Match>('/invite-links/use', {
        token,
      });

      return match;
    } catch (error: any) {
      throw new Error(`Erro ao usar link de convite: ${error.message}`);
    }
  }

  /**
   * Gerar link para compartilhar no WhatsApp
   */
  generateWhatsAppLink(inviteLink: string, matchTitle: string): string {
    const message = encodeURIComponent(
      `🏆 Vem jogar comigo!\n\n` +
      `Pelada: ${matchTitle}\n\n` +
      `Clique aqui para confirmar sua presença:\n${inviteLink}\n\n` +
      `#PeladaPró`
    );

    return `https://wa.me/?text=${message}`;
  }

  /**
   * Gerar link para compartilhar via SMS
   */
  generateSMSLink(inviteLink: string, matchTitle: string): string {
    const message = encodeURIComponent(
      `Vem jogar comigo! Pelada: ${matchTitle}\n${inviteLink}`
    );

    return `sms:?body=${message}`;
  }

  /**
   * Gerar link para compartilhar via Email
   */
  generateEmailLink(inviteLink: string, matchTitle: string): string {
    const subject = encodeURIComponent(`Convite para Pelada: ${matchTitle}`);
    const body = encodeURIComponent(
      `Oi!\n\nVem jogar comigo!\n\n` +
      `Pelada: ${matchTitle}\n\n` +
      `Clique aqui para confirmar sua presença:\n${inviteLink}\n\n` +
      `Abraços!`
    );

    return `mailto:?subject=${subject}&body=${body}`;
  }

  /**
   * Validar se pelada pertence ao grupo
   */
  async validateMatchBelongsToGroup(matchId: string, groupId: string): Promise<boolean> {
    try {
      const match = await this.getMatch(matchId, groupId);
      return match.groupId === groupId;
    } catch {
      return false;
    }
  }

  /**
   * Obter resumo financeiro da pelada
   */
  async getMatchFinancialSummary(matchId: string, groupId: string): Promise<any> {
    const api = getSecureAPIClient();

    try {
      const summary = await api.get(`/matches/${matchId}/financial-summary`, {
        groupId,
      });

      return summary;
    } catch (error: any) {
      throw new Error(`Erro ao obter resumo financeiro: ${error.message}`);
    }
  }

  /**
   * Atualizar configuração de pagamento (Asaas)
   */
  async updatePaymentConfig(
    matchId: string,
    groupId: string,
    paymentConfig: {
      enabled: boolean;
      amount?: number;
      paymentRequired?: boolean;
    }
  ): Promise<void> {
    const api = getSecureAPIClient();

    try {
      await api.put(`/matches/${matchId}/payment-config`, {
        groupId,
        ...paymentConfig,
      });
    } catch (error: any) {
      throw new Error(`Erro ao atualizar configuração de pagamento: ${error.message}`);
    }
  }
}

// Instância singleton
let matchServiceInstance: MatchService | null = null;

export function getMatchService(): MatchService {
  if (!matchServiceInstance) {
    matchServiceInstance = new MatchService();
  }
  return matchServiceInstance;
}
