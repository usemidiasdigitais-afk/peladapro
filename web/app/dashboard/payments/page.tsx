'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Payment {
  id: string
  playerName: string
  playerEmail: string
  matchDate: string
  matchLocation: string
  amount: number
  status: 'PAID' | 'PENDING'
  pixQrCode?: string
  asaasPaymentId?: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      // Simular dados de pagamentos
      const mockPayments: Payment[] = [
        {
          id: '1',
          playerName: 'João Silva',
          playerEmail: 'joao@email.com',
          matchDate: '2026-02-15',
          matchLocation: 'Parque Central',
          amount: 50.00,
          status: 'PAID',
        },
        {
          id: '2',
          playerName: 'Maria Santos',
          playerEmail: 'maria@email.com',
          matchDate: '2026-02-15',
          matchLocation: 'Parque Central',
          amount: 50.00,
          status: 'PENDING',
        },
        {
          id: '3',
          playerName: 'Carlos Oliveira',
          playerEmail: 'carlos@email.com',
          matchDate: '2026-02-15',
          matchLocation: 'Parque Central',
          amount: 50.00,
          status: 'PENDING',
        },
        {
          id: '4',
          playerName: 'Ana Costa',
          playerEmail: 'ana@email.com',
          matchDate: '2026-02-15',
          matchLocation: 'Parque Central',
          amount: 50.00,
          status: 'PAID',
        },
        {
          id: '5',
          playerName: 'Pedro Ferreira',
          playerEmail: 'pedro@email.com',
          matchDate: '2026-02-15',
          matchLocation: 'Parque Central',
          amount: 50.00,
          status: 'PENDING',
        },
      ]

      setPayments(mockPayments)
      setLoading(false)
    } catch (error) {
      console.error('Erro ao buscar pagamentos:', error)
      setLoading(false)
    }
  }

  const generatePixQrCode = async (payment: Payment) => {
    try {
      // Chamar API Asaas para gerar QR Code
      const response = await fetch('/api/payments/asaas/qr-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          amount: payment.amount,
          playerEmail: payment.playerEmail,
        }),
      })

      if (!response.ok) throw new Error('Erro ao gerar QR Code')

      const data = await response.json()
      setSelectedPayment({
        ...payment,
        pixQrCode: data.qrCode,
        asaasPaymentId: data.asaasId,
      })
      setShowQrModal(true)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao gerar QR Code PIX')
    }
  }

  const copyPixKey = (pixKey: string) => {
    navigator.clipboard.writeText(pixKey)
    alert('Chave PIX copiada!')
  }

  const paidCount = payments.filter(p => p.status === 'PAID').length
  const pendingCount = payments.filter(p => p.status === 'PENDING').length
  const paidAmount = payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="text-primary hover:underline mb-4 inline-block">
            ← Voltar
          </Link>
          <h1 className="text-3xl font-bold text-dark mb-2">💳 Gerenciar Pagamentos</h1>
          <p className="text-gray-600">Acompanhe os pagamentos dos jogadores</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-1">Total de Pagamentos</p>
            <p className="text-3xl font-bold text-dark">{payments.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm mb-1">Pagos</p>
            <p className="text-3xl font-bold text-green-600">{paidCount}</p>
          </div>
          <div className="bg-orange-50 rounded-lg shadow p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm mb-1">Pendentes</p>
            <p className="text-3xl font-bold text-orange-600">{pendingCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm mb-1">Valor Recebido</p>
            <p className="text-3xl font-bold text-blue-600">R$ {paidAmount.toFixed(2)}</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando pagamentos...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Jogador</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Partida</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Valor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-dark">Ações</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-dark">{payment.playerName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{payment.playerEmail}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{payment.matchDate}</div>
                      <div className="text-xs text-gray-500">{payment.matchLocation}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-dark">
                      R$ {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          payment.status === 'PAID'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {payment.status === 'PAID' ? '✅ Pago' : '⏳ Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {payment.status === 'PENDING' ? (
                        <button
                          onClick={() => generatePixQrCode(payment)}
                          className="text-primary hover:underline text-sm font-semibold"
                        >
                          📱 Gerar PIX
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Concluído</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* QR Code Modal */}
        {showQrModal && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8">
              <h2 className="text-2xl font-bold text-dark mb-4">QR Code PIX</h2>

              <div className="bg-gray-100 rounded-lg p-6 mb-6 text-center">
                {/* Simular QR Code */}
                <div className="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">📱 QR Code PIX</p>
                    <p className="text-xs text-gray-500">Escaneie com seu celular</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-2">Jogador: <strong>{selectedPayment.playerName}</strong></p>
                <p className="text-sm text-gray-600 mb-2">Valor: <strong>R$ {selectedPayment.amount.toFixed(2)}</strong></p>
                <p className="text-sm text-gray-600">Email: <strong>{selectedPayment.playerEmail}</strong></p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-xs text-blue-800 mb-2">Chave PIX (Cópia e Cola):</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="00020126580014br.gov.bcb.pix0136..."
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-xs"
                  />
                  <button
                    onClick={() => copyPixKey('00020126580014br.gov.bcb.pix0136...')}
                    className="px-3 py-2 bg-primary text-white rounded text-xs font-semibold hover:bg-primary/90"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-dark rounded-lg font-semibold hover:bg-gray-400"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    window.open(`https://wa.me/${selectedPayment.playerEmail}?text=Olá! Segue o QR Code PIX para pagamento da partida.`)
                  }}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
                >
                  📱 WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
