# Funzionalità di Registrazione Vocale - BotChat

## Panoramica
È stata aggiunta la funzionalità di registrazione vocale al componente BotChat, permettendo agli utenti di registrare messaggi vocali che vengono automaticamente trascritti in testo.

## Componenti Aggiunti

### 1. `useVoiceRecording` Hook
- **Posizione**: `components/BotChat/hooks/useVoiceRecording.ts`
- **Funzionalità**: Gestisce la registrazione audio utilizzando expo-av
- **Metodi**:
  - `startRecording()`: Avvia la registrazione
  - `stopRecording()`: Ferma la registrazione e restituisce l'URI del file
  - `requestPermissions()`: Richiede i permessi di accesso al microfono
- **Stati**: 
  - `isRecording`: Stato di registrazione attivo/inattivo
  - `recordingDuration`: Durata della registrazione in secondi

### 2. `VoiceRecordButton` Component
- **Posizione**: `components/BotChat/VoiceRecordButton.tsx`
- **Funzionalità**: Pulsante UI per la registrazione vocale
- **Caratteristiche**:
  - Animazione durante la registrazione
  - Timer visuale della durata
  - Feedback visivo con indicatore rosso
  - Supporto per stati disabilitato/abilitato

### 3. `speechToTextService`
- **Posizione**: `components/BotChat/services/speechToTextService.ts`
- **Funzionalità**: Servizio per la trascrizione speech-to-text
- **Stato Attuale**: Implementazione mock/placeholder
- **Estensibilità**: Predisposto per integrazioni con:
  - OpenAI Whisper
  - Google Cloud Speech-to-Text
  - Azure Cognitive Services
  - AWS Transcribe

## Modifiche ai Componenti Esistenti

### ChatInput
- Aggiunto il pulsante di registrazione vocale
- Gestione degli stati di registrazione e trascrizione
- Disabilitazione dell'input durante la registrazione
- Integrazione con il servizio di trascrizione

### ChatInput Props
- Aggiunta prop opzionale `onSendVoiceMessage`
- Estesa l'interfaccia `ChatInputProps` in `types.ts`

### BotChat Screen
- Aggiunto handler `handleSendVoiceMessage`
- Passaggio delle props al componente ChatInput

## Configurazioni

### app.json
Aggiunti permessi e configurazioni necessarie:

```json
{
  "ios": {
    "infoPlist": {
      "NSMicrophoneUsageDescription": "Questa app richiede l'accesso al microfono per registrare messaggi vocali."
    }
  },
  "android": {
    "permissions": [
      "android.permission.RECORD_AUDIO"
    ]
  },
  "plugins": [
    "expo-av"
  ]
}
```

### Dipendenze
- `expo-av`: Per la registrazione audio

## Utilizzo

1. **Avvio Registrazione**: Toccare il pulsante del microfono
2. **Durante la Registrazione**: 
   - Il pulsante mostra un timer
   - Un indicatore rosso segnala la registrazione attiva
   - L'input di testo è disabilitato
3. **Fine Registrazione**: Toccare nuovamente il pulsante (ora mostra "stop")
4. **Trascrizione**: Il messaggio viene automaticamente trascritto e inserito nel campo di input
5. **Invio**: L'utente può modificare il testo trascritto prima dell'invio

## Implementazioni Future

### Servizio di Trascrizione Reale
Per sostituire il mock con un servizio reale, modificare `speechToTextService.ts`:

```typescript
// Esempio con OpenAI Whisper
class OpenAIWhisperService implements SpeechToTextService {
  async transcribeAudio(audioUri: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUR_OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    const result = await response.json();
    return result.text || 'Trascrizione non disponibile';
  }
}
```

### Possibili Miglioramenti
1. **Cache Audio**: Mantenere i file audio per la riproduzione
2. **Compressione Audio**: Ridurre le dimensioni dei file
3. **Offline Speech-to-Text**: Implementazione locale
4. **Linguaggi Multipli**: Supporto per più lingue
5. **Qualità Audio**: Controllo della qualità di registrazione
6. **Feedback Haptico**: Vibrazione durante la registrazione

## Note Tecniche

- **Formati Audio**: Utilizza m4a per iOS e Android per compatibilità
- **Permessi**: Gestione automatica dei permessi con fallback graceful
- **Performance**: La registrazione non blocca l'UI
- **Memory Management**: Cleanup automatico delle risorse audio
- **Compatibilità**: Supporto per iOS, Android e Web (limitato)
