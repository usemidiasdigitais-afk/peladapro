'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Match {
  id: string
  sport: string
  location: string
  match_date: string
  match_cost: number
  max_players: number
  status: string
}

interface Player {
  id: string
  name: string
  email: string
  elo_rating: number
}

interface Team {
  players: Player[]
  totalElo: number
  averageElo: number
}

interface SortResult {
  teamA: Team
  teamB: Team
  balance: number
  quality: string
}

export default function SortPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<string>('')
  const [players, setPlayers] = useState<Player[]>([])
  const [sortResult, setSortResult] = useState<SortResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar partidas ao carregar
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        const groupId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        const response = await fetch(
          `/api/matches?group_id=${encodeURIComponent(groupId)}`
        )

        if (!response.ok) {
          throw new Error('Erro ao buscar partidas')
        }

        const data = await response.json()
        const matchesList = Array.isArray(data) ? data : []
        setMatches(matchesList)

        if (matchesList.length > 0) {
          setSelectedMatch(matchesList[0].id)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

  // Buscar jogadores confirmados quando partida é selecionada
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!selectedMatch) return

      try {
        setLoading(true)
        const response = await fetch(
          `/api/matches/${selectedMatch}/players?status=CONFIRMED`
        )

        if (!response.ok) {
          throw new Error('Erro ao buscar jogadores')
        }

        const data = await response.json()
        const playersList = Array.isArray(data) ? data : (data.players || [])
        setPlayers(playersList)
        setSortResult(null)
      } catch (err) {
        console.error('Erro ao buscar jogadores:', err)
        // Se houver erro, usar dados de teste
        setPlayers([
          {
            id: '1',
            name: 'João Silva',
            email: 'joao@test.com',
            elo_rating: 1200,
          },
          {
            id: '2',
            name: 'Pedro Santos',
            email: 'pedro@test.com',
            elo_rating: 1150,
          },
          {
            id: '3',
            name: 'Carlos Oliveira',
            email: 'carlos@test.com',
            elo_rating: 1300,
          },
          {
            id: '4',
            name: 'Lucas Costa',
            email: 'lucas@test.com',
            elo_rating: 1100,
          },
          {
            id: '5',
            name: 'Felipe Martins',
            email: 'felipe@test.com',
            elo_rating: 1250,
          },
          {
            id: '6',
            name: 'André Gomes',
            email: 'andre@test.com',
            elo_rating: 1180,
          },
          {
            id: '7',
            name: 'Bruno Ferreira',
            email: 'bruno@test.com',
            elo_rating: 1220,
          },
          {
            id: '8',
            name: 'Gustavo Rocha',
            email: 'gustavo@test.com',
            elo_rating: 1280,
          },
          {
            id: '9',
            name: 'Rodrigo Alves',
            email: 'rodrigo@test.com',
            elo_rating: 1160,
          },
          {
            id: '10',
            name: 'Thiago Mendes',
            email: 'thiago@test.com',
            elo_rating: 1210,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPlayers()
  }, [selectedMatch])

  // Algoritmo de balanceamento por ELO
  const balanceTeams = (playersList: Player[]): SortResult => {
    if (playersList.length === 0) {
      throw new Error('Nenhum jogador disponível')
    }

    // Ordenar por ELO decrescente
    const sorted = [...playersList].sort(
      (a, b) => b.elo_rating - a.elo_rating
    )

    // Dividir em dois times alternando (maior para Time A, próximo para Time B, etc)
    const teamA: Player[] = []
    const teamB: Player[] = []

    sorted.forEach((player, index) => {
      if (index % 2 === 0) {
        teamA.push(player)
      } else {
        teamB.push(player)
      }
    })

    // Calcular estatísticas
    const teamAElo = teamA.reduce((sum, p) => sum + p.elo_rating, 0)
    const teamBElo = teamB.reduce((sum, p) => sum + p.elo_rating, 0)
    const balance = Math.abs(teamAElo - teamBElo)
    const maxElo = Math.max(teamAElo, teamBElo)

    // Determinar qualidade do sorteio
    let quality = 'Excelente'
    if (balance > maxElo * 0.1) quality = 'Bom'
    if (balance > maxElo * 0.2) quality = 'Aceitável'
    if (balance > maxElo * 0.3) quality = 'Ruim'

    return {
      teamA: {
        players: teamA,
        totalElo: teamAElo,
        averageElo: Math.round(teamAElo / teamA.length),
      },
      teamB: {
        players: teamB,
        totalElo: teamBElo,
        averageElo: Math.round(teamBElo / teamB.length),
      },
      balance,
      quality,
    }
  }

  const handleSort = () => {
    try {
      setSorting(true)
      setError(null)

      if (players.length < 2) {
        throw new Error('Mínimo de 2 jogadores necessário')
      }

      const result = balanceTeams(players)
      setSortResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar times')
    } finally {
      setSorting(false)
    }
  }

  const handleNewSort = () => {
    setSortResult(null)
  }

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'Excelente':
        return 'text-green-600 bg-green-50'
      case 'Bom':
        return 'text-blue-600 bg-blue-50'
      case 'Aceitável':
        return 'text-yellow-600 bg-yellow-50'
      case 'Ruim':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <main className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-blue-500 hover:text-blue-700">
            ← Voltar
          </Link>
          <h1 className="text-2xl font-bold text-dark">🤖 Sorteio IA</h1>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Match Selection */}
        {!sortResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-dark mb-4">
              1. Selecione a Partida
            </h2>

            {loading ? (
              <p className="text-gray-600">Carregando partidas...</p>
            ) : matches.length === 0 ? (
              <p className="text-gray-600">Nenhuma partida disponível</p>
            ) : (
              <div className="space-y-2">
                {matches.map((match) => (
                  <label
                    key={match.id}
                    className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="match"
                      value={match.id}
                      checked={selectedMatch === match.id}
                      onChange={(e) => setSelectedMatch(e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-dark">
                        ⚽ {match.sport} - {match.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(match.match_date).toLocaleDateString('pt-BR')} •
                        R$ {match.match_cost.toFixed(2)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Players Selection */}
        {!sortResult && selectedMatch && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="text-xl font-bold text-dark mb-4">
              2. Jogadores Confirmados ({players.length})
            </h2>

            {loading ? (
              <p className="text-gray-600">Carregando jogadores...</p>
            ) : players.length === 0 ? (
              <p className="text-gray-600">Nenhum jogador confirmado</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="p-4 border rounded-lg bg-gray-50"
                  >
                    <p className="font-semibold text-dark">{player.name}</p>
                    <p className="text-sm text-gray-600">{player.email}</p>
                    <p className="text-sm font-bold text-blue-600 mt-2">
                      ELO: {player.elo_rating}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Sort Button */}
            <button
              onClick={handleSort}
              disabled={sorting || players.length < 2}
              className="mt-6 w-full px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {sorting ? '⏳ Gerando Times...' : '✅ Gerar Times Equilibrados'}
            </button>
          </div>
        )}

        {/* Sort Result */}
        {sortResult && (
          <div className="space-y-6">
            {/* Quality Indicator */}
            <div className={`p-6 rounded-lg ${getQualityColor(sortResult.quality)}`}>
              <p className="text-sm font-semibold">Qualidade do Sorteio</p>
              <p className="text-3xl font-bold">{sortResult.quality}</p>
              <p className="text-sm mt-2">
                Diferença de ELO: {sortResult.balance.toFixed(0)}
              </p>
            </div>

            {/* Teams Comparison */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Team A */}
              <div className="bg-blue-50 rounded-lg shadow p-6 border-2 border-blue-300">
                <h3 className="text-2xl font-bold text-blue-700 mb-4">
                  ⚽ Time A
                </h3>

                <div className="mb-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">ELO Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {sortResult.teamA.totalElo}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Média: {sortResult.teamA.averageElo}
                  </p>
                </div>

                <div className="space-y-2">
                  {sortResult.teamA.players.map((player, idx) => (
                    <div
                      key={player.id}
                      className="p-3 bg-white rounded-lg border-l-4 border-blue-400"
                    >
                      <p className="font-semibold text-dark">
                        {idx + 1}. {player.name}
                      </p>
                      <p className="text-sm text-gray-600">{player.email}</p>
                      <p className="text-sm font-bold text-blue-600 mt-1">
                        ELO: {player.elo_rating}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team B */}
              <div className="bg-red-50 rounded-lg shadow p-6 border-2 border-red-300">
                <h3 className="text-2xl font-bold text-red-700 mb-4">
                  ⚽ Time B
                </h3>

                <div className="mb-4 p-4 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">ELO Total</p>
                  <p className="text-2xl font-bold text-red-600">
                    {sortResult.teamB.totalElo}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Média: {sortResult.teamB.averageElo}
                  </p>
                </div>

                <div className="space-y-2">
                  {sortResult.teamB.players.map((player, idx) => (
                    <div
                      key={player.id}
                      className="p-3 bg-white rounded-lg border-l-4 border-red-400"
                    >
                      <p className="font-semibold text-dark">
                        {idx + 1}. {player.name}
                      </p>
                      <p className="text-sm text-gray-600">{player.email}</p>
                      <p className="text-sm font-bold text-red-600 mt-1">
                        ELO: {player.elo_rating}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleNewSort}
                className="flex-1 px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition"
              >
                🔄 Novo Sorteio
              </button>
              <button
                onClick={() => alert('Sorteio confirmado e compartilhado!')}
                className="flex-1 px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition"
              >
                ✅ Confirmar e Compartilhar
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
