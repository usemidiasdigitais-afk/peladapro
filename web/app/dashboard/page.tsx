'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalMatches: number
  totalPlayers: number
  totalRevenue: number
  pendingPayments: number
}

interface Match {
  id: string
  sport: string
  location: string
  match_date: string
  match_cost: number
  max_players: number
  status: string
}

interface User {
  id: string
  email: string
  name: string
  group_id: string
  role: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalMatches: 0,
    totalPlayers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  })
  const [matches, setMatches] = useState<Match[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Obter dados do usuário do localStorage
      const userData = localStorage.getItem('user')
      const storedGroupId = localStorage.getItem('group_id')
      const storedUserId = localStorage.getItem('user_id')
      
      let currentUser: User | null = null

      if (userData) {
        try {
          currentUser = JSON.parse(userData)
          setUser(currentUser)
        } catch (e) {
          console.error('Erro ao parsear dados do usuário:', e)
          setError('Erro ao carregar dados do usuário')
          setLoading(false)
          return
        }
      } else {
        // Se não há usuário logado, usar dados de teste
        currentUser = {
          id: storedUserId || 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: 'usemidiasdigitais@gmail.com',
          name: 'Admin Master',
          group_id: storedGroupId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'ADMIN',
        }
        setUser(currentUser)
      }

      // 2. Buscar partidas filtradas por group_id
      const groupId = currentUser?.group_id || storedGroupId || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      
      if (!groupId) {
        setError('Group ID não encontrado. Por favor, faça login novamente.')
        setLoading(false)
        return
      }
      
      console.log('Buscando partidas para group_id:', groupId)

      const response = await fetch(
        `/api/matches?group_id=${encodeURIComponent(groupId)}&t=${Date.now()}`
      )

      if (!response.ok) {
        throw new Error(`Erro ao buscar partidas: ${response.status}`)
      }

      const data = await response.json()
      const matchesList = Array.isArray(data) ? data : (data.matches || [])

      // 3. Atualizar estado
      setMatches(matchesList)
      setStats({
        totalMatches: matchesList.length,
        totalPlayers: 0,
        totalRevenue: matchesList.reduce(
          (sum: number, m: Match) => sum + (m.match_cost || 0),
          0
        ),
        pendingPayments: 0,
      })
    } catch (err) {
      console.error('Erro ao buscar dados:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  // Mostrar dashboard mesmo sem usuário logado
  const displayEmail = user?.email || 'usemidiasdigitais@gmail.com'

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Data inválida'
      }
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  // Formatar hora
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Hora inválida'
      }
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return ''
    }
  }

  // Traduzir esporte
  const translateSport = (sport: string) => {
    const translations: Record<string, string> = {
      FOOTBALL: 'Futebol',
      FUTSAL: 'Futsal',
      BASKETBALL: 'Basquete',
      VOLLEYBALL: 'Vôlei',
    }
    return translations[sport] || sport
  }

  return (
    <main className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-dark">Pelada Pró</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{displayEmail}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome and Refresh */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-dark mb-2">
              Bem-vindo, {displayEmail}! 👋
            </h2>
            <p className="text-gray-600">Aqui está um resumo do seu painel</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-semibold"
          >
            {refreshing ? '⏳ Atualizando...' : '🔄 Atualizar Dados'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <p className="font-semibold">Erro:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Stat 1 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Partidas</p>
                <p className="text-3xl font-bold text-dark">{stats.totalMatches}</p>
              </div>
              <div className="text-4xl">⚽</div>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Jogadores</p>
                <p className="text-3xl font-bold text-dark">{stats.totalPlayers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Receita Total</p>
                <p className="text-3xl font-bold text-dark">
                  R$ {stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pagamentos Pendentes</p>
                <p className="text-3xl font-bold text-dark">{stats.pendingPayments}</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-dark mb-4">Partidas Recentes</h3>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y">
              {loading ? (
                <div className="p-6 text-center text-gray-600">
                  <p>Carregando partidas...</p>
                </div>
              ) : matches.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  <p>Nenhuma partida criada ainda</p>
                  <p className="text-sm mt-2">
                    Clique em "Criar Partida" para começar
                  </p>
                </div>
              ) : (
                matches.slice(0, 5).map((match) => (
                  <div key={match.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-dark">
                          ⚽ {translateSport(match.sport)} - {match.location}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(match.match_date)} • {formatTime(match.match_date)} •
                          R$ {match.match_cost.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/invite/${match.id}`
                            navigator.clipboard.writeText(link)
                            alert('Link de convite copiado!')
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition whitespace-nowrap"
                        >
                          📋 Copiar Link
                        </button>
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/invite/${match.id}`
                            window.open(
                              `https://wa.me/?text=Vem jogar comigo! ${link}`,
                              '_blank'
                            )
                          }}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition whitespace-nowrap"
                        >
                          💬 WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Create Match */}
          <Link
            href="/dashboard/matches/create"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="text-lg font-bold text-dark mb-2">Criar Partida</h3>
            <p className="text-gray-600 text-sm">
              Crie uma nova partida e convide jogadores
            </p>
          </Link>

          {/* Manage Payments */}
          <Link
            href="/dashboard/payments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-4">💳</div>
            <h3 className="text-lg font-bold text-dark mb-2">Gerenciar Pagamentos</h3>
            <p className="text-gray-600 text-sm">
              Visualize e gerencie todos os pagamentos
            </p>
          </Link>

          {/* AI Sorter */}
          <Link
            href="/dashboard/teams/sort"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer"
          >
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-lg font-bold text-dark mb-2">Sorteio IA</h3>
            <p className="text-gray-600 text-sm">
              Gere times com inteligência artificial
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
