# Pelada Pró - Mobile App

App mobile Expo 54 para gerenciamento de partidas de futebol amador com pagamento automático PIX.

## 🎯 Funcionalidades

- ✅ Autenticação com roles (Super Admin, Admin, Jogador)
- ✅ Dashboard com estatísticas do jogador
- ✅ Gerenciamento de partidas
- ✅ Confirmação de presença
- ✅ Pagamento automático via PIX
- ✅ QR Code dinâmico
- ✅ Integração com backend Pelada Pró

## 🚀 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Expo CLI

### Setup

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Configurar variáveis de ambiente
# Editar .env com suas configurações
```

## 🏃 Executar

### Desenvolvimento

```bash
# Iniciar Metro bundler
npm run dev

# Em outro terminal, abrir no iOS
npm run ios

# Ou abrir no Android
npm run android

# Ou abrir no Web
npm run web
```

## 📁 Estrutura do Projeto

```
pelada-pro-mobile/
├── app/                      # Telas e navegação
│   ├── (tabs)/              # Telas com tab bar
│   │   └── index.tsx        # Dashboard
│   ├── login.tsx            # Tela de login
│   ├── signup.tsx           # Tela de cadastro
│   ├── match/
│   │   └── [id].tsx         # Detalhes da partida
│   └── payment/
│       └── [matchId].tsx    # Tela de pagamento
├── components/              # Componentes reutilizáveis
├── contexts/                # Context API
│   └── AuthContext.tsx      # Autenticação
├── services/                # Serviços
│   └── api.ts              # Cliente API
├── constants/               # Constantes
├── hooks/                   # Custom hooks
├── assets/                  # Imagens e ícones
├── __tests__/               # Testes
└── app.json                 # Configuração Expo
```

## 🔐 Autenticação

### Fluxo de Login

1. Usuário insere email e senha
2. App envia credenciais para backend
3. Backend retorna JWT token
4. Token é armazenado em AsyncStorage
5. Usuário é redirecionado para dashboard

### Roles

- **PLAYER**: Jogador que participa de partidas
- **ADMIN**: Gerencia grupos e partidas
- **SUPER_ADMIN**: Acesso total ao sistema

## 💰 Pagamentos

### Fluxo de Pagamento PIX

1. Jogador clica em "Pagar"
2. App solicita geração de QR Code ao backend
3. Backend gera cobrança no Asaas
4. App exibe QR Code e chave PIX
5. Jogador escaneia QR Code com seu banco
6. Banco realiza transferência
7. Asaas envia webhook confirmando pagamento
8. Backend atualiza status do pagamento
9. App exibe confirmação

## 🔌 API Integration

### Endpoints Utilizados

```
POST   /api/auth/login              - Login
POST   /api/auth/signup             - Cadastro
GET    /api/matches                 - Listar partidas
GET    /api/matches/:id             - Detalhes da partida
POST   /api/matches/:id/confirm     - Confirmar presença
POST   /api/payments/generate-pix   - Gerar QR Code PIX
POST   /api/payments/:id/confirm    - Confirmar pagamento
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

## 📱 Variáveis de Ambiente

```env
# API
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Asaas
EXPO_PUBLIC_ASAAS_API_KEY=your_key
EXPO_PUBLIC_ASAAS_ENVIRONMENT=sandbox

# App
EXPO_PUBLIC_APP_NAME=Pelada Pró
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## 🎨 Design

### Cores

- **Primary**: #F97316 (Orange)
- **Dark**: #1F2937 (Dark Gray)
- **Light**: #F3F4F6 (Light Gray)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)

### Tipografia

- **Font**: Inter, DIN Next
- **Heading**: 28px, Bold
- **Body**: 14px, Regular
- **Small**: 12px, Regular

## 📚 Documentação

- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [Asaas API Documentation](https://docs.asaas.com)

## 📄 Licença

MIT License
