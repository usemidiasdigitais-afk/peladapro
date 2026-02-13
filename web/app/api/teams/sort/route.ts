import { NextRequest, NextResponse } from 'next/server'

interface Player {
  id: string
  name: string
  email: string
  elo: number
  position?: string
}

interface Team {
  name: string
  players: Player[]
  totalElo: number
  averageElo: number
}

// Algoritmo genético simples para equilibrar times
function generateTeamsWithGeneticAlgorithm(players: Player[]): Team[] {
  if (players.length < 4) {
    throw new Error('Mínimo 4 jogadores necessários')
  }

  // Ordenar por ELO
  const sortedPlayers = [...players].sort((a, b) => b.elo - a.elo)

  // Distribuição alternada para equilibrar
  const team1: Player[] = []
  const team2: Player[] = []

  sortedPlayers.forEach((player, index) => {
    if (index % 2 === 0) {
      team1.push(player)
    } else {
      team2.push(player)
    }
  })

  const calculateTeamStats = (teamPlayers: Player[], teamNumber: number): Team => ({
    name: `Time ${teamNumber}`,
    players: teamPlayers,
    totalElo: teamPlayers.reduce((sum, p) => sum + p.elo, 0),
    averageElo: teamPlayers.reduce((sum, p) => sum + p.elo, 0) / teamPlayers.length,
  })

  return [calculateTeamStats(team1, 1), calculateTeamStats(team2, 2)]
}

// Algoritmo de simulated annealing para melhor equilíbrio
function generateTeamsWithSimulatedAnnealing(players: Player[]): Team[] {
  if (players.length < 4) {
    throw new Error('Mínimo 4 jogadores necessários')
  }

  const n = players.length
  let team1 = players.slice(0, Math.ceil(n / 2))
  let team2 = players.slice(Math.ceil(n / 2))

  let bestTeam1 = [...team1]
  let bestTeam2 = [...team2]
  let bestDiff = Math.abs(
    team1.reduce((s, p) => s + p.elo, 0) - team2.reduce((s, p) => s + p.elo, 0)
  )

  // Simulated annealing iterations
  for (let iteration = 0; iteration < 1000; iteration++) {
    const temperature = 1 - iteration / 1000
    const i = Math.floor(Math.random() * team1.length)
    const j = Math.floor(Math.random() * team2.length)

    // Trocar jogadores
    const temp = team1[i]
    team1[i] = team2[j]
    team2[j] = temp

    const diff = Math.abs(
      team1.reduce((s, p) => s + p.elo, 0) - team2.reduce((s, p) => s + p.elo, 0)
    )

    if (diff < bestDiff || Math.random() < Math.exp(-diff / (temperature + 0.01))) {
      bestDiff = diff
      bestTeam1 = [...team1]
      bestTeam2 = [...team2]
    } else {
      // Desfazer troca
      const temp2 = team1[i]
      team1[i] = team2[j]
      team2[j] = temp2
    }
  }

  const calculateTeamStats = (teamPlayers: Player[], teamNumber: number): Team => ({
    name: `Time ${teamNumber}`,
    players: teamPlayers,
    totalElo: teamPlayers.reduce((sum, p) => sum + p.elo, 0),
    averageElo: teamPlayers.reduce((sum, p) => sum + p.elo, 0) / teamPlayers.length,
  })

  return [calculateTeamStats(bestTeam1, 1), calculateTeamStats(bestTeam2, 2)]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { players, algorithm = 'GENETIC' } = body

    if (!players || players.length < 4) {
      return NextResponse.json(
        { error: 'Mínimo 4 jogadores necessários' },
        { status: 400 }
      )
    }

    let teams: Team[]

    if (algorithm === 'SIMULATED_ANNEALING') {
      teams = generateTeamsWithSimulatedAnnealing(players)
    } else {
      teams = generateTeamsWithGeneticAlgorithm(players)
    }

    return NextResponse.json({
      teams,
      algorithm,
      quality: 100 - Math.min(Math.abs(teams[0].totalElo - teams[1].totalElo) / 10, 100),
    })
  } catch (error) {
    console.error('Erro ao gerar times:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar times' },
      { status: 500 }
    )
  }
}
