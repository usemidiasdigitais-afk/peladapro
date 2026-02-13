# Pelada Pró - Painel Admin Web

Painel administrativo SaaS para gerenciamento de partidas de futebol amador com integração de pagamentos Asaas (PIX + Boletos).

## 🎯 Funcionalidades

- ✅ Autenticação de usuário (Login, Signup)
- ✅ Dashboard com analytics
- ✅ Gerenciamento de partidas
- ✅ Gerenciamento de jogadores
- ✅ Integração Asaas (PIX + Boletos)
- ✅ Sorteio preditivo por IA
- ✅ Módulo de churrasco
- ✅ Multi-tenancy (vários grupos/admins)

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- PostgreSQL

### Setup

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente
# Editar .env com suas configurações

# Executar migrations do banco
npm run db:migrate

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🏃 Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

Acesse `http://localhost:3000` no seu navegador.

## 📁 Estrutura do Projeto

```
pelada-pro-web/
├── app/                      # Páginas e rotas
│   ├── page.tsx             # Home
│   ├── login/               # Login
│   ├── signup/              # Signup
│   ├── dashboard/           # Dashboard
│   ├── layout.tsx           # Layout raiz
│   └── globals.css          # Estilos globais
├── components/              # Componentes reutilizáveis
├── lib/                     # Utilitários
├── prisma/                  # Schema do banco
├── public/                  # Arquivos estáticos
├── package.json             # Dependências
├── tsconfig.json            # Configuração TypeScript
├── tailwind.config.ts       # Configuração Tailwind
└── next.config.js           # Configuração Next.js
```

## 🔐 Autenticação

### Fluxo de Login

1. Usuário acessa `/login`
2. Insere email e senha
3. Sistema valida credenciais
4. JWT token é gerado e armazenado
5. Usuário é redirecionado para `/dashboard`

### Roles

- **ADMIN**: Gerencia um grupo
- **SUPER_ADMIN**: Acesso total ao sistema

## 💰 Pagamentos

### Integração Asaas

- PIX (Instantâneo)
- Boletos (Até 3 dias úteis)
- Webhooks para confirmação automática

### Fluxo

1. Jogador confirma presença
2. Sistema gera cobrança no Asaas
3. Jogador recebe QR Code PIX ou Boleto
4. Pagamento é realizado
5. Asaas envia webhook confirmando
6. Sistema atualiza status

## 🤖 Sorteio IA

Gere times automaticamente com base em:
- Histórico de desempenho
- Posição preferida
- Nível de habilidade
- Equilíbrio de times

## 🍖 Módulo de Churrasco

Controle de gastos com churrasco:
- Adicionar itens
- Dividir custos
- Gerar relatórios

## 📱 Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pelada_pro"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Asaas
ASAAS_API_KEY="your_asaas_api_key"
ASAAS_ENVIRONMENT="sandbox"
NEXT_PUBLIC_ASAAS_API_KEY="your_asaas_api_key"
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Executar com cobertura
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## 📚 Documentação

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Asaas API Documentation](https://docs.asaas.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment

### Vercel (Recomendado)

```bash
# Deploy automático ao fazer push
git push origin main
```

### Docker

```bash
# Build imagem
docker build -t pelada-pro-web .

# Executar container
docker run -p 3000:3000 pelada-pro-web
```

### AWS / DigitalOcean

Veja `DEPLOYMENT.md` para instruções detalhadas.

## 📞 Suporte

Para reportar bugs ou solicitar features, abra uma issue no repositório.

## 📄 Licença

MIT License - Veja LICENSE.md para detalhes

---

**Desenvolvido com ❤️ para a comunidade de futebol amador**
