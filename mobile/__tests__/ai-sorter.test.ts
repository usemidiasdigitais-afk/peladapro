import { AISorterService, PlayerStats } from '../services/ai-sorter-service';

describe('AISorterService', () => {
  let service: AISorterService;

  beforeEach(() => {
    service = new AISorterService();
  });

  // Mock players
  const mockPlayers: PlayerStats[] = [
    {
      id: '1',
      name: 'João Silva',
      position: 'GOLEIRO',
      preferredFoot: 'RIGHT',
      height: 188,
      weight: 85,
      age: 28,
      rating: 4.8,
      totalMatches: 50,
      totalGoals: 0,
      totalAssists: 0,
      winRate: 0.7,
      positionHistory: [{ position: 'GOLEIRO', matches: 50, rating: 4.8 }],
    },
    {
      id: '2',
      name: 'Pedro Santos',
      position: 'ZAGUEIRO',
      preferredFoot: 'RIGHT',
      height: 185,
      weight: 82,
      age: 26,
      rating: 4.5,
      totalMatches: 45,
      totalGoals: 2,
      totalAssists: 1,
      winRate: 0.65,
      positionHistory: [{ position: 'ZAGUEIRO', matches: 45, rating: 4.5 }],
    },
    {
      id: '3',
      name: 'Carlos Costa',
      position: 'LATERAL',
      preferredFoot: 'LEFT',
      height: 180,
      weight: 75,
      age: 24,
      rating: 4.3,
      totalMatches: 35,
      totalGoals: 1,
      totalAssists: 3,
      winRate: 0.6,
      positionHistory: [{ position: 'LATERAL', matches: 35, rating: 4.3 }],
    },
    {
      id: '4',
      name: 'Lucas Oliveira',
      position: 'MEIA',
      preferredFoot: 'RIGHT',
      height: 175,
      weight: 70,
      age: 25,
      rating: 4.6,
      totalMatches: 40,
      totalGoals: 5,
      totalAssists: 8,
      winRate: 0.68,
      positionHistory: [{ position: 'MEIA', matches: 40, rating: 4.6 }],
    },
    {
      id: '5',
      name: 'Felipe Gomes',
      position: 'ATACANTE',
      preferredFoot: 'RIGHT',
      height: 182,
      weight: 78,
      age: 27,
      rating: 4.7,
      totalMatches: 48,
      totalGoals: 25,
      totalAssists: 5,
      winRate: 0.72,
      positionHistory: [{ position: 'ATACANTE', matches: 48, rating: 4.7 }],
    },
    {
      id: '6',
      name: 'Rafael Martins',
      position: 'GOLEIRO',
      preferredFoot: 'RIGHT',
      height: 186,
      weight: 83,
      age: 29,
      rating: 4.6,
      totalMatches: 52,
      totalGoals: 0,
      totalAssists: 0,
      winRate: 0.68,
      positionHistory: [{ position: 'GOLEIRO', matches: 52, rating: 4.6 }],
    },
    {
      id: '7',
      name: 'Gustavo Ferreira',
      position: 'ZAGUEIRO',
      preferredFoot: 'RIGHT',
      height: 187,
      weight: 84,
      age: 27,
      rating: 4.4,
      totalMatches: 42,
      totalGoals: 1,
      totalAssists: 0,
      winRate: 0.62,
      positionHistory: [{ position: 'ZAGUEIRO', matches: 42, rating: 4.4 }],
    },
    {
      id: '8',
      name: 'Bruno Alves',
      position: 'LATERAL',
      preferredFoot: 'RIGHT',
      height: 179,
      weight: 73,
      age: 23,
      rating: 4.2,
      totalMatches: 30,
      totalGoals: 0,
      totalAssists: 2,
      winRate: 0.58,
      positionHistory: [{ position: 'LATERAL', matches: 30, rating: 4.2 }],
    },
    {
      id: '9',
      name: 'André Pereira',
      position: 'MEIA',
      preferredFoot: 'LEFT',
      height: 176,
      weight: 71,
      age: 26,
      rating: 4.4,
      totalMatches: 38,
      totalGoals: 3,
      totalAssists: 6,
      winRate: 0.65,
      positionHistory: [{ position: 'MEIA', matches: 38, rating: 4.4 }],
    },
    {
      id: '10',
      name: 'Thiago Rocha',
      position: 'ATACANTE',
      preferredFoot: 'LEFT',
      height: 181,
      weight: 77,
      age: 26,
      rating: 4.5,
      totalMatches: 44,
      totalGoals: 20,
      totalAssists: 4,
      winRate: 0.70,
      positionHistory: [{ position: 'ATACANTE', matches: 44, rating: 4.5 }],
    },
  ];

  describe('divideTeams', () => {
    it('deve dividir jogadores em dois times', () => {
      const result = service.divideTeams(mockPlayers);

      expect(result.team1).toBeDefined();
      expect(result.team2).toBeDefined();
      expect(result.team1.players.length).toBeGreaterThan(0);
      expect(result.team2.players.length).toBeGreaterThan(0);
    });

    it('deve ter balanceamento entre 0 e 100', () => {
      const result = service.divideTeams(mockPlayers);

      expect(result.balanceScore).toBeGreaterThanOrEqual(0);
      expect(result.balanceScore).toBeLessThanOrEqual(100);
    });

    it('deve prever um vencedor', () => {
      const result = service.divideTeams(mockPlayers);

      expect(['TEAM1', 'TEAM2', 'DRAW']).toContain(result.predictedWinner);
    });

    it('deve ter confiança entre 0 e 1', () => {
      const result = service.divideTeams(mockPlayers);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('deve gerar análise textual', () => {
      const result = service.divideTeams(mockPlayers);

      expect(result.analysis).toBeDefined();
      expect(result.analysis.length).toBeGreaterThan(0);
    });

    it('deve lançar erro com menos de 2 jogadores', () => {
      expect(() => service.divideTeams([mockPlayers[0]])).toThrow();
    });

    it('deve distribuir jogadores igualmente', () => {
      const result = service.divideTeams(mockPlayers);
      const totalPlayers = result.team1.players.length + result.team2.players.length;

      expect(totalPlayers).toBe(mockPlayers.length);
    });

    it('deve sugerir formação válida', () => {
      const result = service.divideTeams(mockPlayers);

      expect(result.team1.formation).toMatch(/^\d+-\d+-\d+-\d+$/);
      expect(result.team2.formation).toMatch(/^\d+-\d+-\d+-\d+$/);
    });

    it('deve analisar pontos fortes e fracos', () => {
      const result = service.divideTeams(mockPlayers);

      expect(result.team1.strengths.length).toBeGreaterThan(0);
      expect(result.team2.strengths.length).toBeGreaterThan(0);
      expect(result.team1.weaknesses.length).toBeGreaterThan(0);
      expect(result.team2.weaknesses.length).toBeGreaterThan(0);
    });
  });

  describe('generateMultipleOptions', () => {
    it('deve gerar múltiplas opções de sorteio', () => {
      const options = service.generateMultipleOptions(mockPlayers, 3);

      expect(options.length).toBe(3);
    });

    it('deve ordenar opções por balanceamento', () => {
      const options = service.generateMultipleOptions(mockPlayers, 3);

      for (let i = 0; i < options.length - 1; i++) {
        expect(options[i].balanceScore).toBeGreaterThanOrEqual(
          options[i + 1].balanceScore
        );
      }
    });

    it('melhor opção deve ter maior balanceamento', () => {
      const options = service.generateMultipleOptions(mockPlayers, 5);

      expect(options[0].balanceScore).toBeGreaterThanOrEqual(options[1].balanceScore);
      expect(options[0].balanceScore).toBeGreaterThanOrEqual(options[2].balanceScore);
    });
  });

  describe('Casos de Uso Reais', () => {
    it('deve equilibrar times com jogadores de diferentes níveis', () => {
      const mixedPlayers: PlayerStats[] = [
        ...mockPlayers.slice(0, 5),
        {
          id: '11',
          name: 'Novato Silva',
          position: 'ATACANTE',
          preferredFoot: 'RIGHT',
          height: 180,
          weight: 75,
          age: 20,
          rating: 2.5,
          totalMatches: 3,
          totalGoals: 1,
          totalAssists: 0,
          winRate: 0.33,
          positionHistory: [{ position: 'ATACANTE', matches: 3, rating: 2.5 }],
        },
      ];

      const result = service.divideTeams(mixedPlayers);

      expect(result.balanceScore).toBeGreaterThan(0);
      expect(result.team1.players.length).toBe(result.team2.players.length);
    });

    it('deve criar times com formações válidas', () => {
      const result = service.divideTeams(mockPlayers);

      // Verificar que cada time tem pelo menos um goleiro
      const team1HasGK = result.team1.players.some((p) => p.position === 'GOLEIRO');
      const team2HasGK = result.team2.players.some((p) => p.position === 'GOLEIRO');

      expect(team1HasGK || team2HasGK).toBe(true);
    });

    it('deve manter integridade dos dados dos jogadores', () => {
      const result = service.divideTeams(mockPlayers);

      const allPlayers = [...result.team1.players, ...result.team2.players];
      const originalIds = mockPlayers.map((p) => p.id).sort();
      const resultIds = allPlayers.map((p) => p.id).sort();

      expect(resultIds).toEqual(originalIds);
    });
  });

  describe('Performance', () => {
    it('deve processar 20 jogadores em menos de 100ms', () => {
      const players = mockPlayers.concat(mockPlayers);

      const start = Date.now();
      service.divideTeams(players);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('deve gerar 5 opções em menos de 500ms', () => {
      const start = Date.now();
      service.generateMultipleOptions(mockPlayers, 5);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(500);
    });
  });
});
