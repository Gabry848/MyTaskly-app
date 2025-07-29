# 🔨 Development Build Setup per Notifiche Push

## Perché serve un Development Build?

Con Expo SDK 53+, le notifiche push remote sono state rimosse da **Expo Go**. Per testare le notifiche push, devi creare un **Development Build**.

## ⚠️ Modalità Correnti

### 🏃‍♂️ Expo Go (Attuale)
- ✅ Notifiche locali funzionano
- ❌ Notifiche push remote NON funzionano
- ✅ Sviluppo rapido
- ❌ Limitazioni SDK 53+

### 🏗️ Development Build (Raccomandato per Notifiche)
- ✅ Notifiche locali funzionano
- ✅ Notifiche push remote funzionano
- ✅ Accesso completo alle API native
- ⏱️ Build time più lungo

## 🚀 Come Creare un Development Build

### Per Android:

```bash
# 1. Installa EAS CLI se non l'hai
npm install -g @expo/eas-cli

# 2. Login in EAS
eas login

# 3. Configura il progetto (se non fatto)
eas build:configure

# 4. Crea development build per Android
eas build --platform android --profile development

# 5. Installa l'APK sul tuo dispositivo quando pronto
# (riceverai un link per il download)
```

### Per iOS:

```bash
# 1. Development build per iOS (serve Apple Developer Account)
eas build --platform ios --profile development

# 2. Installa tramite TestFlight o direttamente
```

### Alternativa Locale (più veloce):

```bash
# Per Android (richiede Android Studio)
npx expo run:android

# Per iOS (richiede Xcode e macOS)
npx expo run:ios
```

## 📱 Come Testare

1. **Installa il development build** sul tuo dispositivo
2. **Avvia il development server**:
   ```bash
   npx expo start --dev-client
   ```
3. **Scansiona il QR code** con il development build
4. **Testa le notifiche** dalla schermata di debug

## 🔧 Configurazione EAS (eas.json)

Se non hai un file `eas.json`, verrà creato automaticamente. Dovrebbe includere:

```json
{
  "cli": {
    "version": ">= 13.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  }
}
```

## 🧪 Test delle Notifiche

Una volta installato il development build:

1. Apri l'app dal development build
2. Vai alla schermata di debug notifiche
3. Il token push dovrebbe essere generato correttamente
4. Testa le notifiche tramite il backend

## 🆘 Troubleshooting

### Errore: "No development build found"
- Assicurati di aver installato il development build sul dispositivo
- Controlla che il QR code sia scansionato con il development build, non Expo Go

### Token push non generato
- Verifica che il `projectId` sia corretto in `app.json`
- Controlla i permessi delle notifiche
- Guarda i log per errori specifici

### Build fallisce
- Verifica la connessione internet
- Controlla i log dettagliati con `eas build --platform android --profile development --verbose`

## 📚 Documentazione Utile

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)