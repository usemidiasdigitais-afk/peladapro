# Guia de Sorteio Preditivo por IA - Pelada Pró

Documentação completa do sistema de sorteio inteligente que usa IA para criar times equilibrados.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Algoritmo](#algoritmo)
3. [Fatores de Análise](#fatores-de-análise)
4. [API](#api)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Testes](#testes)

## 🎯 Visão Geral

O sistema de sorteio preditivo analisa dados históricos de jogadores para:

- ✅ Criar times equilibrados
- ✅ Prever resultado do jogo
- ✅ Sugerir formações táticas
- ✅ Identificar pontos fortes e fracos
- ✅ Gerar múltiplas opções

### Benefícios

- **Jogos mais competitivos** - Times equilibrados resultam em partidas disputadas
- **Melhor experiência** - Todos os jogadores têm chance de ganhar
- **Análise profunda** - Usa múltiplos fatores, não apenas rating
- **Sugestões táticas** - Recomenda formações baseadas nos jogadores

## 🧠 Algoritmo

### 1. Cálculo de Rating do Jogador

O rating geral é calculado considerando:

```
Rating Final = Rating Base + Experiência + Gols + Assistências + Taxa de Vitória

Onde:
- Rating Base: Avaliação do jogador (0-5)
- Experiência: (Partidas / 50) * 0.1
- Gols: (Gols / Partidas) * 0.05
- Assistências: (Assistências / Partidas) * 0.05
- Taxa de Vitória: Taxa de Vitória * 0.1
```

### 2. Divisão de Times (Draft Alternado)

```
1. Ordenar jogadores por rating (maior para menor)
2. Distribuir alternadamente:
   - Jogador 1 → Time A
   - Jogador 2 → Time B
   - Jogador 3 → Time A
   - Jogador 4 → Time B
   - ...
3. Otimizar com swaps para melhorar balanceamento
```

### 3. Otimização de Balanceamento

```
Enquanto houver melhoria:
  Para cada jogador no Time A:
    Para cada jogador no Time B:
      Se trocar melhora balanceamento:
        Fazer swap
        Continuar
```

### 4. Cálculo de Score de Balanceamento

```
Score = 100 - (|Força Time A - Força Time B| / Diferença Máxima) * 100

Onde:
- Score 90-100: Perfeitamente equilibrado
- Score 75-89: Bom balanceamento
- Score 50-74: Balanceamento aceitável
- Score < 50: Desequilibrado
```

### 5. Predição de Resultado

```
Diferença = Força Time A - Força Time B

Se |Diferença| < 0.3:
  Resultado = DRAW
Senão se Diferença > 0:
  Resultado = TEAM1 WINS
Senão:
  Resultado = TEAM2 WINS
```

### 6. Cálculo de Confiança

```
Confiança = 
  (Tamanho Amostra / 20) * 0.3 +
  (Score Balanceamento / 100) * 0.4 +
  (Experiência Média / 50) * 0.3

Onde:
- Tamanho Amostra: Número de jogadores
- Score Balanceamento: Score de balanceamento (0-100)
- Experiência Média: Média de partidas jogadas
```

## 📊 Fatores de Análise

### Rating do Jogador

| Fator | Peso | Descrição |
|-------|------|-----------|
| Rating Base | 60% | Avaliação geral (0-5) |
| Experiência | 10% | Número de partidas |
| Gols | 5% | Média de gols por partida |
| Assistências | 5% | Média de assistências |
| Taxa de Vitória | 10% | Porcentagem de vitórias |
| Histórico de Posição | 10% | Desempenho em diferentes posições |

### Compatibilidade de Posição

```
Goleiro: Goleiro
Zagueiro: Zagueiro, Lateral
Lateral: Lateral, Zagueiro
Meia: Meia, Atacante, Lateral
Atacante: Atacante, Meia
```

### Força do Time

```
Força = Rating Médio + Bônus Posições + Bônus Experiência

Onde:
- Rating Médio: Média dos ratings dos jogadores
- Bônus Posições: +0.2 por cada posição única (máx 5)
- Bônus Experiência: +0.1 se experiência coletiva > 500 partidas
```

## 🔌 API

### Classe: AISorterService

#### Método: divideTeams()

```typescript
const result = service.divideTeams(players: PlayerStats[]): SorterResult

Retorna:
{
  team1: Team,
  team2: Team,
  balanceScore: number (0-100),
  predictedWinner: 'TEAM1' | 'TEAM2' | 'DRAW',
  confidence: number (0-1),
  analysis: string
}
```

#### Método: generateMultipleOptions()

```typescript
const options = service.generateMultipleOptions(
  players: PlayerStats[],
  count: number = 3
): SorterResult[]

Retorna array de SorterResult ordenado por balanceamento
```

### Interface: PlayerStats

```typescript
interface PlayerStats {
  id: string;
  name: string;
  position: 'GOLEIRO' | 'ZAGUEIRO' | 'LATERAL' | 'MEIA' | 'ATACANTE';
  preferredFoot: 'LEFT' | 'RIGHT' | 'BOTH';
  height: number; // em cm
  weight: number; // em kg
  age: number;
  rating: number; // 0-5
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  winRate: number; // 0-1
  positionHistory: Array<{
    position: string;
    matches: number;
    rating: number;
  }>;
}
```

### Interface: Team

```typescript
interface Team {
  id: string;
  name: string;
  players: PlayerStats[];
  formation: string; // ex: "1-4-3-2"
  predictedRating: number;
  strengths: string[];
  weaknesses: string[];
}
```

### Interface: SorterResult

```typescript
interface SorterResult {
  team1: Team;
  team2: Team;
  balanceScore: number; // 0-100
  predictedWinner: 'TEAM1' | 'TEAM2' | 'DRAW';
  confidence: number; // 0-1
  analysis: string;
}
```

## 📚 Exemplos de Uso

### Exemplo 1: Sorteio Simples

```typescript
import { initAISorterService } from '@/services/ai-sorter-service';

const service = initAISorterService();

// Jogadores disponíveis
const players = [
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
  // ... mais jogadores
];

// Gerar sorteio
const result = service.divideTeams(players);

console.log('Time A:', result.team1.name);
console.log('Time B:', result.team2.name);
console.log('Balanceamento:', result.balanceScore);
console.log('Vencedor Previsto:', result.predictedWinner);
console.log('Análise:', result.analysis);
```

### Exemplo 2: Múltiplas Opções

```typescript
// Gerar 5 opções de sorteio
const options = service.generateMultipleOptions(players, 5);

// Melhor opção (maior balanceamento)
const bestOption = options[0];

console.log('Melhor balanceamento:', bestOption.balanceScore);
console.log('Formação Time A:', bestOption.team1.formation);
console.log('Formação Time B:', bestOption.team2.formation);
```

### Exemplo 3: Análise Detalhada

```typescript
const result = service.divideTeams(players);

console.log('=== TIME A ===');
console.log('Jogadores:', result.team1.players.map(p => p.name));
console.log('Formação:', result.team1.formation);
console.log('Rating Previsto:', result.team1.predictedRating);
console.log('Pontos Fortes:', result.team1.strengths);
console.log('Pontos Fracos:', result.team1.weaknesses);

console.log('\n=== TIME B ===');
console.log('Jogadores:', result.team2.players.map(p => p.name));
console.log('Formação:', result.team2.formation);
console.log('Rating Previsto:', result.team2.predictedRating);
console.log('Pontos Fortes:', result.team2.strengths);
console.log('Pontos Fracos:', result.team2.weaknesses);

console.log('\n=== ANÁLISE ===');
console.log('Score de Balanceamento:', result.balanceScore);
console.log('Vencedor Previsto:', result.predictedWinner);
console.log('Confiança:', (result.confidence * 100).toFixed(1) + '%');
console.log('Análise:', result.analysis);
```

## 🧪 Testes

### Executar Testes

```bash
npm test -- ai-sorter.test.ts
npm test -- ai-sorter.test.ts --coverage
```

### Cobertura de Testes

- ✅ Divisão de times
- ✅ Balanceamento
- ✅ Predição de vencedor
- ✅ Confiança
- ✅ Análise textual
- ✅ Múltiplas opções
- ✅ Performance
- ✅ Casos de uso reais

### Resultados Esperados

| Teste | Esperado |
|-------|----------|
| Divisão de times | ✅ Passa |
| Balanceamento 0-100 | ✅ Passa |
| Predição válida | ✅ Passa |
| Confiança 0-1 | ✅ Passa |
| Análise textual | ✅ Passa |
| Performance < 100ms | ✅ Passa |

## 🚀 Integração com App

### Tela de Sorteio

```typescript
import { useRouter } from 'expo-router';
import { initAISorterService } from '@/services/ai-sorter-service';

export default function SorterScreen() {
  const router = useRouter();
  const service = initAISorterService();

  const handleGenerateTeams = async () => {
    try {
      // Obter jogadores do backend
      const players = await apiClient.getMatchPlayers(matchId);

      // Gerar sorteio
      const result = service.divideTeams(players);

      // Exibir resultado
      setTeams(result);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao gerar times');
    }
  };

  return (
    // ... UI
  );
}
```

## 📈 Métricas de Sucesso

- ✅ **Balanceamento Médio**: > 80
- ✅ **Confiança Média**: > 0.7
- ✅ **Performance**: < 100ms para 20 jogadores
- ✅ **Cobertura de Testes**: > 95%

## 🔮 Futuras Melhorias

- [ ] Machine Learning com histórico de partidas
- [ ] Análise de química entre jogadores
- [ ] Predição de gols
- [ ] Recomendações táticas em tempo real
- [ ] Análise de padrões de jogo

---

**Desenvolvido com ❤️ para criar partidas mais equilibradas e divertidas**
