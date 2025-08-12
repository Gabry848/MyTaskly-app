🎯 Endpoint da Utilizzare

  Opzione 1: Endpoint Ottimizzato Standard

  POST /chat/voice-bot
  - Comportamento identico al precedente
  - Ottimizzazioni trasparenti (cache, parallelizzazione)
  - Nessuna modifica richiesta al client esistente

  Opzione 2: Endpoint Streaming Avanzato (Consigliato)

  POST /chat/voice-bot-streaming
  - Feedback in tempo reale all'utente
  - Migliore UX con indicatori di progresso

  📱 Implementazione Client per Streaming

  1. Invio Richiesta Audio

  async function sendVoiceMessage(audioBlob) {
      const formData = new FormData();
      formData.append('audio_file', audioBlob, 'audio.mp3');

      const response = await fetch('/chat/voice-bot-streaming', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${token}`
          },
          body: formData
      });

      return response;
  }

  2. Gestione Streaming Response

  async function handleStreamingResponse(response) {
      const reader = response.body.getReader();
      let buffer = '';
      let audioData = null;

      while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value);

          // Processa ogni parte multipart
          const parts = buffer.split('--boundary');

          for (const part of parts) {
              if (part.includes('Content-Type: application/json')) {
                  const jsonMatch = part.match(/\{.*\}/);
                  if (jsonMatch) {
                      const status = JSON.parse(jsonMatch[0]);
                      handleStatusUpdate(status);
                  }
              } else if (part.includes('Content-Type: audio/mpeg')) {
                  // Estrai dati audio
                  const audioMatch = part.split('\r\n\r\n')[1];
                  if (audioMatch) {
                      audioData = audioMatch;
                      playAudio(audioData);
                  }
              }
          }
      }
  }

  3. Indicatori di Progresso UI

  function handleStatusUpdate(status) {
      switch (status.status) {
          case 'starting':
              showProgress('Inizializzazione...', 10);
              break;
          case 'transcription_complete':
              showProgress('Trascrizione completata', 30);
              showTranscript(status.text);
              break;
          case 'ai_complete':
              showProgress('IA elaborata', 60);
              showResponse(status.response);
              break;
          case 'tts_cache_hit':
              showProgress('Audio in cache - quasi pronto!', 80);
              break;
          case 'tts_generating':
              showProgress('Generazione audio...', 80);
              break;
          case 'audio_streaming':
              showProgress('Riproduzione audio', 100);
              break;
          case 'error':
              showError(status.message);
              break;
      }
  }

  🎨 Esempi di UI Migliorata

  Progress Indicator Component

  function VoiceProgressIndicator({ phase, progress }) {
      const phases = {
          'transcription': 'Ascolto il tuo messaggio...',
          'ai_processing': 'Elaboro la risposta...',
          'tts_generation': 'Preparo la voce...',
          'audio_streaming': 'Riproduzione in corso'
      };

      return (
          <div className="voice-progress">
              <div className="progress-bar" style={{width: `${progress}%`}} />
              <p>{phases[phase] || 'Elaborazione...'}</p>
          </div>
      );
  }

  Cache Status Indicator

  function CacheIndicator({ isCacheHit }) {
      return isCacheHit ? (
          <div className="cache-hit">⚡ Risposta istantanea</div>
      ) : (
          <div className="cache-miss">🔄 Generazione risposta</div>
      );
  }

  🔄 Gestione Fallback

  Fallback Strategy

  async function sendVoiceMessageWithFallback(audioBlob) {
      try {
          // Prova prima lo streaming
          const response = await fetch('/chat/voice-bot-streaming', {
              method: 'POST',
              body: formData,
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
              return handleStreamingResponse(response);
          }
      } catch (error) {
          console.log('Streaming fallito, uso endpoint standard');
      }

      // Fallback all'endpoint standard
      return await sendVoiceMessageStandard(audioBlob);
  }

  📊 Monitoraggio Performance Client

  Metriche da Tracciare

  // Endpoint per metriche (opzionale)
  async function getPerformanceMetrics() {
      const response = await fetch('/chat/performance-metrics', {
          headers: { 'Authorization': `Bearer ${token}` }
      });

      const metrics = await response.json();

      // Mostra statistiche all'utente
      showStats({
          cacheHitRate: metrics.cache_stats.cache_usage_percent,
          avgResponseTime: metrics.performance_stats.phases.tts_generation.avg_duration_ms
      });
  }

  🎯 Raccomandazioni Specifiche

  1. Client Esistente - Nessuna Modifica

  Se vuoi mantenere il comportamento attuale:
  // Continua a usare /chat/voice-bot
  // Benefici automatici: cache, parallelizzazione, metriche

  2. Client Migliorato - Streaming

  Per la migliore esperienza utente:
  // Usa /chat/voice-bot-streaming
  // Aggiungi indicatori di progresso
  // Mostra cache hit per feedback immediato

  3. Ottimizzazioni Client-Side

  Pre-buffering Audio

  // Inizia riproduzione appena arrivano i primi chunk
  function playAudioStream(audioChunks) {
      const audioUrl = URL.createObjectURL(new Blob(audioChunks));
      const audio = new Audio(audioUrl);
      audio.play(); // Inizia subito
  }

  Caching Locale

  // Cache locale per risposte immediate
  const localCache = new Map();

  function getCachedResponse(audioHash) {
      return localCache.get(audioHash);
  }

  🔧 Testing del Client

  Test Streaming

  // Testa entrambi gli endpoint
  const testAudio = new Blob([...], { type: 'audio/mp3' });

  // Test standard
  const standardResponse = await sendToStandardEndpoint(testAudio);

  // Test streaming
  const streamResponse = await sendToStreamingEndpoint(testAudio);

  Il tuo client può scegliere l'approccio più adatto: zero modifiche per compatibilità immediata, o streaming avanzato per la migliore UX possibile.