/**
 * Serviço de IA para Sorteio Preditivo de Times
 * 
 * Utiliza análise de desempenho histórico, posição preferida,
 * nível de habilidade e estilo de jogo para criar times equilibrados.
 */

export interface PlayerStats {
  id: string;
  name: string;
  position: string;
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  height: number; // em cm
  weight: number; // em kg
  age: number;
  rating: number; // 0-5
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  winRate: number; // 0-1
  positionHistory: {
    position: string;
    matches: number;
    rating: number;
  }[];
}

export interface Team {
  id: string;
  name: string;
  players: PlayerStats[];
  formation: string;
  predictedRating: number;
  strengths: string[];
  weaknesses: string[];
}

export interface SorterResult {
  team1: Team;
  team2: Team;
  balanceScore: number; // 0-100 (100 = perfectly balanced)
  predictedWinner: 'TEAM1' | 'TEAM2' | 'DRAW';
  confidence: number; // 0-1
  analysis: string;
}

export class AISorterService {
  /**
   * Calcular rating geral do jogador baseado em múltiplos fatores
   */
  private calculatePlayerRating(player: PlayerStats): number {
    const baseRating = player.rating;
    const experienceFactor = Math.min(player.totalMatches / 50, 1) * 0.1;
    const goalFactor = (player.totalGoals / Math.max(player.totalMatches, 1)) * 0.05;
    const assistFactor = (player.totalAssists / Math.max(player.totalMatches, 1)) * 0.05;
    const winRateFactor = player.winRate * 0.1;

    const totalRating =
      baseRating +
      experienceFactor +
      goalFactor +
      assistFactor +
      winRateFactor;

    return Math.min(totalRating, 5);
  }

  /**
   * Calcular compatibilidade entre jogadores
   */
  private calculatePlayerCompatibility(
    player1: PlayerStats,
    player2: PlayerStats
  ): number {
    let compatibility = 0;

    // Compatibilidade de posição
    if (this.canPlayTogether(player1.position, player2.position)) {
      compatibility += 0.3;
    }

    // Compatibilidade de pé
    if (player1.preferredFoot === player2.preferredFoot) {
      compatibility += 0.1;
    }

    // Compatibilidade de experiência
    const expDiff = Math.abs(player1.totalMatches - player2.totalMatches);
    const expCompatibility = Math.max(0, 1 - expDiff / 100);
    compatibility += expCompatibility * 0.2;

    // Compatibilidade de rating
    const ratingDiff = Math.abs(
      this.calculatePlayerRating(player1) -
      this.calculatePlayerRating(player2)
    );
    const ratingCompatibility = Math.max(0, 1 - ratingDiff / 5);
    compatibility += ratingCompatibility * 0.4;

    return Math.min(compatibility, 1);
  }

  /**
   * Verificar se dois jogadores podem jogar juntos
   */
  private canPlayTogether(pos1: string, pos2: string): boolean {
    const compatiblePositions: { [key: string]: string[] } = {
      GOLEIRO: ['GOLEIRO'],
      ZAGUEIRO: ['ZAGUEIRO', 'LATERAL'],
      LATERAL: ['LATERAL', 'ZAGUEIRO'],
      MEIA: ['MEIA', 'ATACANTE', 'LATERAL'],
      ATACANTE: ['ATACANTE', 'MEIA'],
    };

    return (compatiblePositions[pos1] || []).includes(pos2);
  }

  /**
   * Calcular força geral de um time
   */
  private calculateTeamStrength(players: PlayerStats[]): number {
    const ratings = players.map((p) => this.calculatePlayerRating(p));
    const avgRating = ratings.reduce((a, b) => a + b, 0) / players.length;

    // Bônus por balanceamento de posições
    const positions = players.map((p) => p.position);
    const uniquePositions = new Set(positions).size;
    const positionBonus = (uniquePositions / 5) * 0.2;

    // Bônus por experiência coletiva
    const totalMatches = players.reduce((sum, p) => sum + p.totalMatches, 0);
    const experienceBonus = Math.min(totalMatches / 500, 1) * 0.1;

    return avgRating + positionBonus + experienceBonus;
  }

  /**
   * Dividir jogadores em dois times equilibrados
   */
  divideTeams(players: PlayerStats[]): SorterResult {
    if (players.length < 2) {
      throw new Error('Mínimo de 2 jogadores necessário');
    }

    // Ordenar jogadores por rating
    const sortedPlayers = [...players].sort(
      (a, b) =>
        this.calculatePlayerRating(b) - this.calculatePlayerRating(a)
    );

    // Algoritmo de draft alternado para balanceamento
    const team1Players: PlayerStats[] = [];
    const team2Players: PlayerStats[] = [];

    for (let i = 0; i < sortedPlayers.length; i++) {
      if (i % 2 === 0) {
        team1Players.push(sortedPlayers[i]);
      } else {
        team2Players.push(sortedPlayers[i]);
      }
    }

    // Tentar melhorar balanceamento com swaps
    this.optimizeTeamBalance(team1Players, team2Players);

    // Criar objetos de time
    const team1 = this.createTeam('Time A', team1Players);
    const team2 = this.createTeam('Time B', team2Players);

    // Calcular métricas
    const balanceScore = this.calculateBalanceScore(team1, team2);
    const predictedWinner = this.predictWinner(team1, team2);
    const confidence = this.calculateConfidence(team1, team2, players.length);

    return {
      team1,
      team2,
      balanceScore,
      predictedWinner,
      confidence,
      analysis: this.generateAnalysis(team1, team2, balanceScore),
    };
  }

  /**
   * Otimizar balanceamento de times com swaps
   */
  private optimizeTeamBalance(
    team1: PlayerStats[],
    team2: PlayerStats[]
  ): void {
    let improved = true;
    let iterations = 0;
    const maxIterations = 10;

    while (improved && iterations < maxIterations) {
      improved = false;
      iterations++;

      const strength1 = this.calculateTeamStrength(team1);
      const strength2 = this.calculateTeamStrength(team2);
      const diff = Math.abs(strength1 - strength2);

      // Tentar swaps para melhorar balanceamento
      for (let i = 0; i < team1.length; i++) {
        for (let j = 0; j < team2.length; j++) {
          // Fazer swap temporário
          const temp = team1[i];
          team1[i] = team2[j];
          team2[j] = temp;

          const newStrength1 = this.calculateTeamStrength(team1);
          const newStrength2 = this.calculateTeamStrength(team2);
          const newDiff = Math.abs(newStrength1 - newStrength2);

          // Se melhorou, manter swap
          if (newDiff < diff) {
            improved = true;
            break;
          } else {
            // Desfazer swap
            team2[j] = team1[i];
            team1[i] = temp;
          }
        }
        if (improved) break;
      }
    }
  }

  /**
   * Criar objeto de time com análise
   */
  private createTeam(name: string, players: PlayerStats[]): Team {
    const strength = this.calculateTeamStrength(players);
    const avgRating =
      players.reduce((sum, p) => sum + this.calculatePlayerRating(p), 0) /
      players.length;

    return {
      id: `team-${Date.now()}-${Math.random()}`,
      name,
      players,
      formation: this.suggestFormation(players),
      predictedRating: strength,
      strengths: this.analyzeStrengths(players),
      weaknesses: this.analyzeWeaknesses(players),
    };
  }

  /**
   * Sugerir formação tática baseada em jogadores
   */
  private suggestFormation(players: PlayerStats[]): string {
    const positions = players.map((p) => p.position);
    const gk = positions.filter((p) => p === 'GOLEIRO').length;
    const df = positions.filter((p) => p === 'ZAGUEIRO' || p === 'LATERAL').length;
    const mf = positions.filter((p) => p === 'MEIA').length;
    const fw = positions.filter((p) => p === 'ATACANTE').length;

    return `${gk}-${df}-${mf}-${fw}`;
  }

  /**
   * Analisar pontos fortes do time
   */
  private analyzeStrengths(players: PlayerStats[]): string[] {
    const strengths: string[] = [];

    // Força ofensiva
    const totalGoals = players.reduce((sum, p) => sum + p.totalGoals, 0);
    if (totalGoals > 20) {
      strengths.push('Ataque forte');
    }

    // Defesa
    const defenders = players.filter(
      (p) => p.position === 'ZAGUEIRO' || p.position === 'LATERAL'
    );
    if (defenders.length >= 3) {
      strengths.push('Defesa sólida');
    }

    // Criatividade
    const totalAssists = players.reduce((sum, p) => sum + p.totalAssists, 0);
    if (totalAssists > 10) {
      strengths.push('Criatividade no meio');
    }

    // Experiência
    const avgMatches =
      players.reduce((sum, p) => sum + p.totalMatches, 0) / players.length;
    if (avgMatches > 30) {
      strengths.push('Time experiente');
    }

    return strengths.length > 0 ? strengths : ['Equilibrado'];
  }

  /**
   * Analisar pontos fracos do time
   */
  private analyzeWeaknesses(players: PlayerStats[]): string[] {
    const weaknesses: string[] = [];

    // Falta de goleiro
    const hasGoalkeeper = players.some((p) => p.position === 'GOLEIRO');
    if (!hasGoalkeeper) {
      weaknesses.push('Sem goleiro');
    }

    // Falta de defesa
    const defenders = players.filter(
      (p) => p.position === 'ZAGUEIRO' || p.position === 'LATERAL'
    );
    if (defenders.length < 2) {
      weaknesses.push('Defesa fraca');
    }

    // Rating baixo
    const avgRating =
      players.reduce((sum, p) => sum + this.calculatePlayerRating(p), 0) /
      players.length;
    if (avgRating < 3) {
      weaknesses.push('Nível técnico baixo');
    }

    // Falta de experiência
    const avgMatches =
      players.reduce((sum, p) => sum + p.totalMatches, 0) / players.length;
    if (avgMatches < 10) {
      weaknesses.push('Pouca experiência');
    }

    return weaknesses.length > 0 ? weaknesses : ['Nenhuma fraqueza aparente'];
  }

  /**
   * Calcular score de balanceamento (0-100)
   */
  private calculateBalanceScore(team1: Team, team2: Team): number {
    const diff = Math.abs(team1.predictedRating - team2.predictedRating);
    const maxDiff = 2; // Diferença máxima esperada

    // Score inversamente proporcional à diferença
    const score = Math.max(0, 100 - (diff / maxDiff) * 100);

    return Math.round(score);
  }

  /**
   * Prever vencedor baseado em força dos times
   */
  private predictWinner(
    team1: Team,
    team2: Team
  ): 'TEAM1' | 'TEAM2' | 'DRAW' {
    const diff = team1.predictedRating - team2.predictedRating;

    if (Math.abs(diff) < 0.3) {
      return 'DRAW';
    }

    return diff > 0 ? 'TEAM1' : 'TEAM2';
  }

  /**
   * Calcular confiança da predição
   */
  private calculateConfidence(
    team1: Team,
    team2: Team,
    totalPlayers: number
  ): number {
    // Confiança baseada em:
    // 1. Tamanho da amostra
    const sampleConfidence = Math.min(totalPlayers / 20, 1);

    // 2. Balanceamento
    const balanceScore = this.calculateBalanceScore(team1, team2);
    const balanceConfidence = balanceScore / 100;

    // 3. Experiência dos jogadores
    const avgMatches =
      (team1.players.reduce((sum, p) => sum + p.totalMatches, 0) +
        team2.players.reduce((sum, p) => sum + p.totalMatches, 0)) /
      (team1.players.length + team2.players.length);
    const experienceConfidence = Math.min(avgMatches / 50, 1);

    // Média ponderada
    return (
      sampleConfidence * 0.3 +
      balanceConfidence * 0.4 +
      experienceConfidence * 0.3
    );
  }

  /**
   * Gerar análise textual do sorteio
   */
  private generateAnalysis(
    team1: Team,
    team2: Team,
    balanceScore: number
  ): string {
    let analysis = '';

    if (balanceScore >= 90) {
      analysis = '⚖️ Times perfeitamente equilibrados! Espera-se um jogo muito disputado.';
    } else if (balanceScore >= 75) {
      analysis = '✅ Bom balanceamento entre os times. Jogo competitivo esperado.';
    } else if (balanceScore >= 50) {
      analysis = '⚠️ Times com diferenças notáveis. Pode haver desequilíbrio.';
    } else {
      analysis = '❌ Times muito desequilibrados. Recomenda-se novo sorteio.';
    }

    return analysis;
  }

  /**
   * Gerar múltiplas opções de sorteio
   */
  generateMultipleOptions(players: PlayerStats[], count: number = 3): SorterResult[] {
    const options: SorterResult[] = [];

    for (let i = 0; i < count; i++) {
      // Embaralhar jogadores
      const shuffled = [...players].sort(() => Math.random() - 0.5);
      options.push(this.divideTeams(shuffled));
    }

    // Ordenar por balanceamento
    return options.sort((a, b) => b.balanceScore - a.balanceScore);
  }
}

/**
 * Inicializar serviço de IA
 */
export function initAISorterService(): AISorterService {
  return new AISorterService();
}

export default AISorterService;
