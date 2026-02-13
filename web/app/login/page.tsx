'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Mock login com dados completos incluindo group_id
      if (email && password) {
        // Dados do usuário admin com group_id
        const userData = {
          id: 'a47ac10b-58cc-4372-a567-0e02b2c3d479',
          email: email,
          name: 'Admin Master',
          group_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          role: 'ADMIN',
        }
        
        // Salvar no localStorage
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('group_id', userData.group_id)
        localStorage.setItem('user_id', userData.id)
        
        // Salvar em cookie também (para persistência entre abas)
        document.cookie = `group_id=${userData.group_id}; path=/; max-age=${7 * 24 * 60 * 60}`
        document.cookie = `user_id=${userData.id}; path=/; max-age=${7 * 24 * 60 * 60}`
        
        router.push('/dashboard')
      } else {
        setError('Email e senha são obrigatórios')
      }
    } catch (err) {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-dark to-dark/80 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-dark mb-2">Pelada Pró</h1>
            <p className="text-gray-600">Faça login no seu painel</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-gray-500 text-sm">ou</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Signup Link */}
          <p className="text-center text-gray-600">
            Não tem conta?{' '}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Criar conta
            </Link>
          </p>

          {/* Demo Info */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <p className="font-semibold mb-1">🎮 Modo Demo</p>
            <p>Use qualquer email e senha para testar</p>
          </div>
        </div>
      </div>
    </main>
  )
}
