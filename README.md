# Pelada Pró - Sistema de Gestão de Peladas

Sistema completo para gerenciar peladas (partidas de futebol amador) com pagamento PIX, sorteio IA e rateio automático de despesas.

## 📁 Estrutura do Projeto

```
peladapro/
├── web/                    # Frontend Next.js
│   ├── app/               # Páginas e rotas
│   ├── components/        # Componentes React
│   ├── public/            # Arquivos estáticos
│   └── package.json       # Dependências
├── mobile/                # App mobile Expo
│   ├── app/              # Telas e navegação
│   ├── components/       # Componentes React Native
│   └── package.json      # Dependências
├── docs/                 # Documentação completa
│   ├── README_FINAL.md
│   ├── DEPLOYMENT_PRODUCTION.md
│   ├── FINAL_DELIVERY_REPORT.md
│   └── schema.sql        # Schema do banco de dados
└── .env.example          # Variáveis de ambiente
```

## 🚀 Quick Start

### 1. Clonar Repositório
```bash
git clone https://github.com/usemidiasdigitais-afk/peladapro.git
cd peladapro
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e preencha com seus valores:

```bash
cp .env.example .env
```

**Variáveis necessárias:**
- `DATABASE_URL` - URL do PostgreSQL (Supabase)
- `ASAAS_API_KEY` - Chave da API Asaas para pagamentos PIX
- `JWT_SECRET` - Chave secreta para JWT (mínimo 32 caracteres)
- `GOOGLE_PLACES_API_KEY` - Chave da API Google Places

### 3. Instalar Dependências

**Frontend Web:**
```bash
cd web
npm install
npm run dev
```

**Mobile:**
```bash
cd mobile
npm install
npm run dev
```

## 📊 Banco de Dados

O projeto usa PostgreSQL com Supabase. Para criar as tabelas, execute:

```bash
psql $DATABASE_URL < docs/schema.sql
```

## 🔐 Segurança

⚠️ **IMPORTANTE:** 
- Nunca faça commit do arquivo `.env` com dados reais
- Use apenas `.env.example` para versionamento
- Guarde suas chaves em um gestor de senhas
- Ative 2FA no Supabase e Asaas

## 📱 Funcionalidades

- ✅ **Autenticação** - Login com email/senha
- ✅ **Criar Peladas** - Agendar partidas com data, local e valor
- ✅ **Pagamento PIX** - Integração com Asaas para gerar QR Codes
- ✅ **Sorteio IA** - Algoritmo genético para dividir times equilibrados
- ✅ **Rateio de Churrasco** - Cálculo automático de débitos
- ✅ **Convites** - Compartilhar via link ou WhatsApp

## 📚 Documentação

- **[README_FINAL.md](./README_FINAL.md)** - Visão geral do projeto
- **[DEPLOYMENT_PRODUCTION.md](./DEPLOYMENT_PRODUCTION.md)** - Guia de deployment
- **[FINAL_DELIVERY_REPORT.md](./FINAL_DELIVERY_REPORT.md)** - Relatório técnico completo

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14
- React 19
- TypeScript
- Tailwind CSS

**Mobile:**
- Expo SDK 54
- React Native
- NativeWind

**Backend:**
- Node.js
- PostgreSQL (Supabase)
- tRPC
- Drizzle ORM

**Integrações:**
- Asaas (Pagamentos PIX)
- Google Places (Autocomplete)
- JWT (Autenticação)

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação em `/docs`
2. Verifique o arquivo `.env.example` para configurações
3. Revise o DEPLOYMENT_PRODUCTION.md para troubleshooting

## 📄 Licença

Proprietary - Todos os direitos reservados

---

**Desenvolvido por:** Manus AI  
**Data:** Fevereiro de 2026  
**Versão:** 1.0.0
