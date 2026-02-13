# Guia de Build e Deployment - Pelada Pró Mobile

## 📋 Checklist Pré-Build

Antes de fazer build, certifique-se de:

- [ ] Todas as dependências instaladas (`npm install`)
- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Assets gerados (ícones, splash screens)
- [ ] Testes passando (`npm test`)
- [ ] Código sem erros TypeScript (`npm run check`)
- [ ] Versão atualizada em `app.json`

## 🚀 Build Local

### iOS (macOS apenas)

```bash
# Build para iOS
npm run ios

# Ou com EAS
eas build --platform ios --local
```

### Android

```bash
# Build para Android
npm run android

# Ou com EAS
eas build --platform android --local
```

### Web

```bash
# Build para Web
npm run web
```

## 🌐 Build com EAS (Recomendado)

### Setup Inicial

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login na conta Expo
eas login

# Configurar projeto
eas build:configure
```

### Build para iOS

```bash
# Build para App Store
eas build --platform ios --auto-submit

# Ou sem auto-submit
eas build --platform ios
```

### Build para Android

```bash
# Build para Google Play
eas build --platform android --auto-submit

# Ou sem auto-submit
eas build --platform android
```

### Build para Ambos

```bash
# Build simultâneo para iOS e Android
eas build --platform all
```

## 📱 Publicar nas App Stores

### App Store (iOS)

```bash
# Submeter para App Store
eas submit --platform ios

# Ou durante o build
eas build --platform ios --auto-submit
```

**Requisitos:**
- Apple Developer Account
- Certificado de desenvolvimento
- Provisioning profiles

### Google Play Store (Android)

```bash
# Submeter para Google Play
eas submit --platform android

# Ou durante o build
eas build --platform android --auto-submit
```

**Requisitos:**
- Google Play Developer Account
- Keystore configurado
- App signing key

## 🔐 Configuração de Segurança

### Variáveis de Ambiente

```bash
# Copiar exemplo
cp .env.example .env

# Editar com valores reais
EXPO_PUBLIC_API_URL=https://api.peladapro.com
EXPO_PUBLIC_ASAAS_API_KEY=sk_live_xxxxx
EXPO_PUBLIC_ASAAS_ENVIRONMENT=production
```

### Secrets no EAS

```bash
# Adicionar secrets
eas secret:create

# Listar secrets
eas secret:list

# Deletar secrets
eas secret:delete
```

## 📊 Versioning

### Semantic Versioning

```json
{
  "expo": {
    "version": "MAJOR.MINOR.PATCH"
  }
}
```

**Exemplo:**
- `1.0.0` - Release inicial
- `1.1.0` - Nova feature
- `1.0.1` - Bug fix

### Build Numbers

```bash
# iOS
eas build --platform ios --release-channel production

# Android
eas build --platform android --release-channel production
```

## 🧪 Testes Pré-Deployment

```bash
# Executar todos os testes
npm test

# Testes com cobertura
npm test -- --coverage

# Verificar tipos TypeScript
npm run check

# Lint
npm run lint
```

## 📦 Distribuição

### Expo Go (Desenvolvimento)

```bash
# Publicar para Expo Go
eas publish
```

### Internal Distribution (Beta)

```bash
# Build para distribuição interna
eas build --platform ios --distribution internal
eas build --platform android --distribution internal
```

### Production

```bash
# Build para produção
eas build --platform ios --auto-submit
eas build --platform android --auto-submit
```

## 🔍 Monitoramento

### Logs

```bash
# Ver logs de build
eas build:view

# Ver logs de submissão
eas submit:view
```

### Analytics

Integre com serviços de analytics:

```typescript
import * as Analytics from 'expo-firebase-analytics';

// Track events
Analytics.logEvent('match_created', {
  matchId: '123',
  players: 10,
});
```

## 🐛 Troubleshooting

### Erro: "Build failed"

1. Verificar logs: `eas build:view`
2. Verificar dependências: `npm install`
3. Limpar cache: `npm cache clean --force`
4. Tentar novamente: `eas build --platform ios --clear-cache`

### Erro: "Submission failed"

1. Verificar credenciais
2. Verificar certificados (iOS)
3. Verificar keystore (Android)
4. Contatar suporte da app store

### Erro: "Assets not found"

1. Verificar se assets existem em `assets/`
2. Verificar caminhos em `app.json`
3. Regenerar assets se necessário

## 📚 Recursos

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

## ✅ Checklist Final

Antes de publicar:

- [ ] Versão atualizada
- [ ] Changelog atualizado
- [ ] Testes passando
- [ ] Build local testado
- [ ] Screenshots preparadas
- [ ] Descrição da app atualizada
- [ ] Privacy policy atualizada
- [ ] Terms of service atualizado
- [ ] Certificados/keys válidos
- [ ] Variáveis de ambiente corretas
