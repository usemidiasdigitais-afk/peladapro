# Configuração de Ícones iOS - Pelada Pró

Guia para configurar os ícones iOS no Xcode.

## 📁 Estrutura de Ícones

Os ícones iOS foram gerados em múltiplas resoluções:

```
assets/ios-icons/
├── AppIcon-1024.png    (1024x1024) - App Store
├── AppIcon-512.png     (512x512)   - Backup
├── AppIcon-256.png     (256x256)   - Backup
├── AppIcon-180.png     (180x180)   - iPhone 6s/7/8 Plus
├── AppIcon-167.png     (167x167)   - iPad Pro
├── AppIcon-152.png     (152x152)   - iPad
├── AppIcon-120.png     (120x120)   - iPhone 6s/7/8
├── AppIcon-87.png      (87x87)     - Watch
├── AppIcon-80.png      (80x80)     - iPad Mini
├── AppIcon-76.png      (76x76)     - iPad
├── AppIcon-60.png      (60x60)     - iPhone
├── AppIcon-58.png      (58x58)     - Spotlight
├── AppIcon-40.png      (40x40)     - Spotlight
├── AppIcon-29.png      (29x29)     - Settings
├── AppIcon-27.png      (27x27)     - Settings
└── Contents.json       - Metadados
```

## 🔧 Como Usar no Xcode

### Opção 1: Usar o Expo (Recomendado)

O Expo automaticamente detecta e usa o ícone em `./assets/images/icon.png`.

```bash
# Build para iOS
eas build --platform ios
```

### Opção 2: Manual no Xcode

Se você estiver usando Xcode diretamente:

1. **Abrir o projeto iOS:**
   ```bash
   open ios/peladapro.xcworkspace
   ```

2. **Ir para Assets.xcassets:**
   - Selecionar "AppIcon" na navegação esquerda

3. **Importar ícones:**
   - Arrastar `AppIcon-1024.png` para a seção "App Store"
   - Arrastar `AppIcon-180.png` para "iPhone Notification"
   - Arrastar `AppIcon-120.png` para "iPhone Spotlight"
   - Arrastar `AppIcon-76.png` para "iPad"
   - E assim por diante...

4. **Ou usar o Contents.json:**
   - Copiar o arquivo `Contents.json` para dentro do App Icon Set
   - Xcode automaticamente mapeia os ícones

## 📊 Resoluções por Dispositivo

| Dispositivo | Resolução | Arquivo |
|-------------|-----------|---------|
| iPhone 14/15 | 180x180 | AppIcon-180.png |
| iPhone 13/12/11 | 120x120 | AppIcon-120.png |
| iPhone SE | 120x120 | AppIcon-120.png |
| iPad (7ª geração) | 152x152 | AppIcon-152.png |
| iPad Pro | 167x167 | AppIcon-167.png |
| App Store | 1024x1024 | AppIcon-1024.png |
| Spotlight | 58x58 | AppIcon-58.png |
| Settings | 29x29 | AppIcon-29.png |

## ✅ Verificação

Para verificar se os ícones estão corretos:

1. **Build local:**
   ```bash
   eas build --platform ios --local
   ```

2. **Verificar no simulador:**
   ```bash
   xcrun simctl install booted build/peladapro.app
   ```

3. **Verificar no dispositivo:**
   - Instalar via TestFlight
   - Verificar se o ícone aparece corretamente

## 🎨 Personalização

Se você quiser personalizar os ícones:

1. **Editar o ícone original:**
   ```bash
   # Editar assets/images/icon.png
   ```

2. **Regenerar os ícones:**
   ```bash
   # Usar ImageMagick
   convert assets/images/icon.png -resize 1024x1024 assets/ios-icons/AppIcon-1024.png
   convert assets/images/icon.png -resize 180x180 assets/ios-icons/AppIcon-180.png
   # ... etc
   ```

3. **Fazer build novamente:**
   ```bash
   eas build --platform ios
   ```

## 📝 Notas

- Os ícones foram gerados a partir de `assets/images/icon.png`
- Todos os ícones mantêm a mesma proporção e qualidade
- O arquivo `Contents.json` mapeia cada ícone para seu tamanho e dispositivo
- Expo automaticamente usa o ícone correto durante o build

## 🚀 Build para App Store

```bash
# Build para App Store
eas build --platform ios

# Submeter para App Store
eas submit --platform ios
```

O Expo automaticamente incluirá o ícone correto (1024x1024) para a App Store.

---

**Ícones iOS configurados com sucesso!** ✅
