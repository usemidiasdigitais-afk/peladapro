'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateMatchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [location, setLocation] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    value: '',
    maxPlayers: '11',
    description: '',
  })

  // Simular autocomplete do Google Places
  const handleLocationChange = async (e: string) => {
    setLocation(e)
    setFormData({ ...formData, location: e })

    if (e.length > 2) {
      // Simulação de sugestões (em produção, usar Google Places API)
      const mockSuggestions = [
        { id: 1, name: 'Parque Central - São Paulo, SP' },
        { id: 2, name: 'Estádio Municipal - São Paulo, SP' },
        { id: 3, name: 'Campo do Morumbi - São Paulo, SP' },
        { id: 4, name: 'Quadra Poliesportiva - São Paulo, SP' },
      ]
      setSuggestions(mockSuggestions.filter(s => 
        s.name.toLowerCase().includes(e.toLowerCase())
      ))
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectSuggestion = (suggestion: any) => {
    setFormData({ ...formData, location: suggestion.name })
    setLocation(suggestion.name)
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validar dados
      if (!formData.date || !formData.time || !formData.location || !formData.value) {
        alert('Por favor, preencha todos os campos obrigatórios')
        setLoading(false)
        return
      }

      // Combinar data e hora
      const matchDateTime = `${formData.date}T${formData.time}`

      // Obter group_id e user_id da sessão
      const groupId = localStorage.getItem('group_id') || 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      const userId = localStorage.getItem('user_id') || 'a47ac10b-58cc-4372-a567-0e02b2c3d479'
      
      console.log('Criando partida com group_id:', groupId, 'user_id:', userId)

      // Chamar API para criar partida
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_id: groupId,
          created_by: userId,
          date: matchDateTime,
          location: formData.location,
          match_cost: parseFloat(formData.value),
          max_players: parseInt(formData.maxPlayers),
          notes: formData.description,
          sport: 'FOOTBALL',
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar partida')
      }

      const data = await response.json()
      console.log('Partida criada:', data)
      alert('Partida criada com sucesso!')
      
      // Revalidar cache e atualizar dashboard
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/dashboard' }),
      }).catch(err => console.log('Revalidação:', err))
      
      // Aguardar um pouco para garantir que a API retorna dados atualizados
      setTimeout(() => {
        console.log('Redirecionando para dashboard...')
        router.push('/dashboard')
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao criar partida. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">Criar Nova Partida</h1>
          <p className="text-gray-600">Preencha os dados abaixo para criar uma nova partida</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Data */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Data da Partida *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Hora */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Hora da Partida *
              </label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Local com Autocomplete */}
            <div className="md:col-span-2 relative">
              <label className="block text-sm font-semibold text-dark mb-2">
                Local da Partida *
              </label>
              <input
                type="text"
                required
                placeholder="Digite o local (ex: Parque Central)"
                value={location}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {/* Sugestões */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-10">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                    >
                      📍 {suggestion.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Valor por Jogador (R$) *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                placeholder="50.00"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Limite de Vagas */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">
                Limite de Vagas *
              </label>
              <select
                value={formData.maxPlayers}
                onChange={(e) => setFormData({ ...formData, maxPlayers: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="5">5 Jogadores</option>
                <option value="8">8 Jogadores</option>
                <option value="10">10 Jogadores</option>
                <option value="11">11 Jogadores (Padrão)</option>
                <option value="12">12 Jogadores</option>
                <option value="15">15 Jogadores</option>
                <option value="20">20 Jogadores</option>
              </select>
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-dark mb-2">
                Descrição (Opcional)
              </label>
              <textarea
                placeholder="Ex: Futebol 7, nível amador, com churrasco..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 transition"
            >
              {loading ? 'Criando...' : '✅ Criar Partida'}
            </button>
            <Link
              href="/dashboard"
              className="flex-1 bg-gray-300 text-dark py-3 rounded-lg font-semibold hover:bg-gray-400 transition text-center"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Após criar a partida, você poderá gerar um link de convite para compartilhar com os jogadores.
          </p>
        </div>
      </div>
    </div>
  )
}
