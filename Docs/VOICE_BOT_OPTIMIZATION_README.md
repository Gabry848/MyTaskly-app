# 🚀 Bot Vocale Ottimizzato - Guida Completa

## 📋 Panoramica

Questo aggiornamento introduce significative ottimizzazioni per ridurre la latenza del bot vocale, implementando streaming audio e playback in tempo reale.

## ✨ Nuove Funzionalità

### 🎯 Modalità Dual-Mode
- **Base Mode**: Upload completo del file (compatibilità massima)
- **Advanced Mode**: Streaming audio con latenza ridotta

### ⚡ Streaming Features
- **Upload Streaming**: Invio del file audio a chunk
- **Response Streaming**: Ricezione progressiva della risposta
- **Real-time Playback**: Riproduzione audio appena ricevuto
- **Fallback Automatico**: Ritorna al metodo classico se streaming non supportato

### 📊 Performance Monitoring
- Statistiche real-time durante lo streaming
- Confronto performance tra modalità
- Metriche di latenza e throughput

## 🛠️ Installazione

### Dipendenze Aggiunte
```bash
npm install react-native-blob-util react-native-fs eventsource
```

### File Modificati/Aggiunti
- `src/services/botservice.ts` - Servizio principale ottimizzato
- `src/hooks/useOptimizedVoiceBot.ts` - Hook React per gestione avanzata
- `src/services/VoiceBotOptimizedExample.ts` - Esempi di utilizzo
- `components/OptimizedVoiceBotDemo.tsx` - Componente demo

## 🚀 Utilizzo Rapido

### Hook Semplificato
```typescript
import { useSimpleVoiceBot } from '../src/hooks/useOptimizedVoiceBot';

function MyComponent() {
  const { sendVoiceMessage, isLoading, response, error } = useSimpleVoiceBot();
  
  const handleVoiceMessage = async (audioUri: string) => {
    const result = await sendVoiceMessage(audioUri, true); // true = streaming
  };
}
```

### Hook Avanzato
```typescript
import { useOptimizedVoiceBot } from '../src/hooks/useOptimizedVoiceBot';

function AdvancedComponent() {
  const {
    sendOptimizedVoiceMessage,
    isProcessing,
    streamingProgress,
    currentResponse,
    realtimeStats
  } = useOptimizedVoiceBot();
  
  const handleAdvancedMessage = async (audioUri: string) => {
    await sendOptimizedVoiceMessage(
      audioUri,
      "advanced", // modalità streaming
      true, // abilita aggiornamenti real-time
    );
  };
}
```

### API Diretta
```typescript
import { sendVoiceMessageToBotOptimized } from '../src/services/botservice';

// Modalità base (upload completo)
const baseResponse = await sendVoiceMessageToBotOptimized(audioUri, "base");

// Modalità advanced (streaming)
const streamResponse = await sendVoiceMessageToBotOptimized(
  audioUri,
  "advanced",
  (chunk) => console.log('Chunk ricevuto:', chunk), // callback testo
  (audio) => console.log('Audio ricevuto:', audio.byteLength) // callback audio
);
```

## 🎛️ Configurazione Server

### Endpoint Richiesti

#### Streaming (Opzionale)
```
POST /chat_bot_voice_stream
- Supporta Transfer-Encoding: chunked
- Accetta multipart/form-data con stream=true
- Risponde con chunk progressivi
```

#### Capabilities Check (Opzionale)
```
GET /capabilities
- Risponde con { supports_audio_streaming: boolean }
```

### Formato Risposta Streaming
```json
{
  "mode": "stream",
  "chunks": [
    { "type": "text", "data": "Testo riconosciuto..." },
    { "type": "audio", "data": "data:audio/mp3;base64,..." }
  ]
}
```

## 📊 Performance Benefits

### Metriche Attese
- **Riduzione latenza**: 30-60% in modalità streaming
- **First Response Time**: 50-70% più veloce
- **User Experience**: Feedback progressivo durante elaborazione

### Benchmark Example
```
Modalità Base:     2.5s total time
Modalità Advanced: 1.2s total time (52% improvement)
First Chunk:       0.3s (80% improvement)
```

## 🔧 Compatibilità

### Piattaforme Supportate
- ✅ React Native iOS
- ✅ React Native Android  
- ✅ React Native Web
- ✅ Expo managed workflow

### Fallback Strategy
1. Tenta streaming se `modelType === "advanced"`
2. Se streaming fallisce → modalità base ottimizzata
3. Se base ottimizzata fallisce → metodo originale
4. Logs dettagliati per debugging

## 📱 Componente Demo

Il componente `OptimizedVoiceBotDemo` fornisce:
- Interface completa per testare le funzionalità
- Registrazione audio integrata
- Confronto performance real-time
- Visualizzazione statistiche streaming
- Controlli per debugging

### Utilizzo Demo
```typescript
import OptimizedVoiceBotDemo from './components/OptimizedVoiceBotDemo';

// Nel tuo componente principale
<OptimizedVoiceBotDemo />
```

## 🐛 Debugging

### Log Levels
```typescript
// Abilita logging dettagliato
console.log('🚀 MODALITÀ OTTIMIZZATA - Modello:', modelType);
console.log('📝 Chunk ricevuto:', chunk);
console.log('🎵 Audio chunk ricevuto:', audioData.byteLength);
```

### Error Handling
- Errori automaticamente loggati con emoji identificativi
- Fallback automatico su errori di streaming
- Messaggi user-friendly per errori comuni

### Troubleshooting

#### Server non supporta streaming
```
⚠️ Server non supporta streaming, fallback su upload classico
```
**Soluzione**: Normale, il sistema funziona in modalità compatibilità

#### Rate limiting
```
⚠️ Il servizio è temporaneamente sovraccarico
```
**Soluzione**: Riprova dopo qualche secondo

#### Configurazione server
```
❌ Il servizio di riconoscimento vocale non è configurato
```
**Soluzione**: Contatta l'amministratore del server

## 🎯 Best Practices

### 1. Scelta Modalità
- **Base**: Per applicazioni critiche che richiedono massima affidabilità
- **Advanced**: Per UX ottimale con latenza ridotta

### 2. Error Handling
```typescript
try {
  const response = await sendOptimizedVoiceMessage(audioUri, "advanced");
} catch (error) {
  // Il fallback è automatico, gestisci solo UI
  setErrorMessage("Errore temporaneo, riprova");
}
```

### 3. Memory Management
```typescript
// Cleanup necessario
useEffect(() => {
  return () => {
    stopAllAudioStreams(); // Pulisci streaming attivi
  };
}, []);
```

### 4. User Feedback
```typescript
// Sfrutta i callback per UI reattiva
await sendOptimizedVoiceMessage(
  audioUri,
  "advanced",
  (chunk) => setProgressText(prev => prev + chunk), // Aggiorna UI progressivamente
  (audio) => setAudioProgress(prev => prev + 1) // Mostra progresso audio
);
```

## 🔄 Migration Guide

### Da Versione Precedente
1. Le funzioni esistenti continuano a funzionare
2. Aggiungi nuovi hook per funzionalità avanzate
3. Testa gradualmente le modalità ottimizzate
4. Monitora performance e stabilità

### Esempio Migration
```typescript
// PRIMA
const response = await sendVoiceMessageToBot(audioUri, "base");

// DOPO (compatibile)
const response = await sendVoiceMessageToBotOptimized(audioUri, "base");

// DOPO (ottimizzato)
const response = await sendVoiceMessageToBotOptimized(audioUri, "advanced");
```

## 📈 Roadmap Future

### Planned Features
- [ ] WebSocket streaming support
- [ ] Audio compression ottimizzata
- [ ] Buffering intelligente
- [ ] Streaming bidirezionale
- [ ] Metrics dashboard integrato

### Experimental
- [ ] Real-time voice activity detection
- [ ] Adaptive quality streaming
- [ ] Edge computing integration

## 💡 Tips & Tricks

### Performance Optimization
```typescript
// Pre-configura audio per ridurre latency
await Audio.setAudioModeAsync({
  allowsRecordingIOS: true,
  playsInSilentModeIOS: true,
  shouldDuckAndroid: false,
  playThroughEarpieceAndroid: false,
});
```

### Network Optimization
```typescript
// Usa chunk size ottimali per la tua rete
const OPTIMAL_CHUNK_SIZE = Platform.OS === 'ios' ? 8192 : 4096;
```

### Memory Optimization
```typescript
// Limita buffer audio per evitare memory leaks
const MAX_AUDIO_BUFFER_SIZE = 1024 * 1024; // 1MB
```

---

## 🤝 Contributing

Per contribuire alle ottimizzazioni:
1. Testa le nuove funzionalità
2. Raccogli metriche performance
3. Segnala bug o suggerimenti
4. Proponi miglioramenti

## 📞 Support

Per problemi o domande:
- Controlla i logs con emoji per identificare il problema
- Verifica la compatibilità server
- Testa il fallback automatico
- Consulta la sezione troubleshooting

---

*Versione 2.0.0 - Streaming Audio Optimization*
