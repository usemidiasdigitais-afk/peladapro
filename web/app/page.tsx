import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-dark to-dark/80">
      <div className="container mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Pelada Pró
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Gerenciamento de Partidas de Futebol Amador
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
            <div className="text-4xl mb-4">⚽</div>
            <h3 className="text-xl font-bold text-white mb-2">Gerenciar Partidas</h3>
            <p className="text-gray-300">
              Crie, edite e gerencie partidas com facilidade
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Pagamentos PIX</h3>
            <p className="text-gray-300">
              Receba pagamentos via PIX e Boletos automaticamente
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 border border-white/20">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">Sorteio IA</h3>
            <p className="text-gray-300">
              Sorteio preditivo de times com inteligência artificial
            </p>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition"
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className="px-8 py-3 bg-white/20 text-white rounded-lg font-semibold hover:bg-white/30 transition border border-white/30"
          >
            Criar Conta
          </Link>
        </div>
      </div>
    </main>
  )
}
