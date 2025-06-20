import { 
  sendVoiceMessageToBotOptimized, 
  stopAllAudioStreams,
  sendVoiceMessageToBot 
} from '../services/botservice';

/**
 * ESEMPIO DI UTILIZZO DELLE FUNZIONALITÀ OTTIMIZZATE
 * 
 * Questo file mostra come utilizzare le nuove funzionalità di streaming audio
 * per ridurre la latenza del bot vocale.
 */

export class VoiceBotOptimizedExample {
  
  /**
   * Esempio: Invio messaggio vocale con streaming avanzato
   */
  async sendOptimizedVoiceMessage(audioUri: string) {
    console.log('🚀 Invio messaggio vocale ottimizzato...');
    
    try {
      // Usa modalità advanced per attivare lo streaming
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "advanced", // ⚡ Modalità streaming
        
        // Callback per chunk di testo ricevuti in tempo reale
        (chunk: string) => {
          console.log('📝 Chunk testo ricevuto:', chunk);
          // Qui puoi aggiornare l'UI progressivamente
          this.updateUIWithTextChunk(chunk);
        },
        
        // Callback per chunk audio ricevuti
        (audioData: ArrayBuffer) => {
          console.log('🎵 Chunk audio ricevuto, dimensione:', audioData.byteLength);
          // L'audio viene riprodotto automaticamente dal sistema
        }
      );
      
      console.log('✅ Risposta completa ricevuta:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Errore nel messaggio vocale ottimizzato:', error);
      throw error;
    }
  }
  
  /**
   * Esempio: Modalità base (upload classico)
   */
  async sendBaseVoiceMessage(audioUri: string) {
    console.log('📤 Invio messaggio vocale modalità base...');
    
    try {
      // Usa modalità base per upload classico (più stabile)
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "base" // 🔄 Modalità upload completo
      );
      
      console.log('✅ Risposta base ricevuta:', response);
      return response;
      
    } catch (error) {
      console.error('❌ Errore nel messaggio vocale base:', error);
      
      // Fallback automatico su metodo originale
      console.log('🔄 Tentativo fallback su metodo originale...');
      return await sendVoiceMessageToBot(audioUri, "base");
    }
  }
  
  /**
   * Esempio: Gestione streaming con controllo manuale
   */
  async sendVoiceWithManualControl(audioUri: string) {
    console.log('🎛️ Invio messaggio con controllo manuale...');
    
    let receivedChunks: string[] = [];
    let audioChunksCount = 0;
    
    try {
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "advanced",
        
        // Gestione avanzata dei chunk di testo
        (chunk: string) => {
          receivedChunks.push(chunk);
          console.log(`📝 Chunk ${receivedChunks.length}: ${chunk}`);
          
          // Aggiorna UI progressivamente
          this.updateProgressiveText(receivedChunks.join(''));
          
          // Implementa logica personalizzata
          if (chunk.includes('STOP')) {
            console.log('🛑 Comando STOP rilevato, ferma streaming');
            stopAllAudioStreams();
          }
        },
        
        // Gestione avanzata dei chunk audio
        (audioData: ArrayBuffer) => {
          audioChunksCount++;
          console.log(`🎵 Audio chunk ${audioChunksCount}, dimensione: ${audioData.byteLength} bytes`);
          
          // Implementa buffer custom o effetti audio
          this.processAudioChunk(audioData, audioChunksCount);
        }
      );
      
      console.log('📊 Statistiche sessione:');
      console.log(`- Chunk di testo ricevuti: ${receivedChunks.length}`);
      console.log(`- Chunk audio ricevuti: ${audioChunksCount}`);
      console.log(`- Risposta finale: ${response}`);
      
      return {
        finalResponse: response,
        textChunks: receivedChunks,
        audioChunksCount
      };
      
    } catch (error) {
      console.error('❌ Errore nel controllo manuale:', error);
      throw error;
    }
  }
  
  /**
   * Esempio: Confronto performance tra modalità
   */
  async comparePerformance(audioUri: string) {
    console.log('📊 Confronto performance tra modalità...');
    
    const results = {
      base: { time: 0, response: '', error: null },
      advanced: { time: 0, response: '', error: null },
      original: { time: 0, response: '', error: null }
    };
    
    // Test modalità base ottimizzata
    try {
      const startBase = Date.now();
      results.base.response = await sendVoiceMessageToBotOptimized(audioUri, "base");
      results.base.time = Date.now() - startBase;
      console.log(`✅ Base ottimizzata: ${results.base.time}ms`);
    } catch (error) {
      results.base.error = error;
      console.log(`❌ Base ottimizzata fallita:`, error);
    }
    
    // Test modalità advanced streaming
    try {
      const startAdvanced = Date.now();
      results.advanced.response = await sendVoiceMessageToBotOptimized(audioUri, "advanced");
      results.advanced.time = Date.now() - startAdvanced;
      console.log(`✅ Advanced streaming: ${results.advanced.time}ms`);
    } catch (error) {
      results.advanced.error = error;
      console.log(`❌ Advanced streaming fallito:`, error);
    }
    
    // Test metodo originale
    try {
      const startOriginal = Date.now();
      results.original.response = await sendVoiceMessageToBot(audioUri, "base");
      results.original.time = Date.now() - startOriginal;
      console.log(`✅ Metodo originale: ${results.original.time}ms`);
    } catch (error) {
      results.original.error = error;
      console.log(`❌ Metodo originale fallito:`, error);
    }
    
    // Analizza risultati
    console.log('📈 RISULTATI PERFORMANCE:');
    console.log('Base ottimizzata:', results.base.time, 'ms');
    console.log('Advanced streaming:', results.advanced.time, 'ms');
    console.log('Metodo originale:', results.original.time, 'ms');
    
    // Calcola miglioramento
    if (results.original.time > 0 && results.advanced.time > 0) {
      const improvement = ((results.original.time - results.advanced.time) / results.original.time) * 100;
      console.log(`🚀 Miglioramento latenza: ${improvement.toFixed(1)}%`);
    }
    
    return results;
  }
  
  /**
   * Gestione cleanup quando il componente viene smontato
   */
  cleanup() {
    console.log('🧹 Cleanup streaming audio...');
    stopAllAudioStreams();
  }
  
  // === METODI DI SUPPORTO (da implementare nell'UI) ===
  
  private updateUIWithTextChunk(chunk: string) {
    // Implementa l'aggiornamento dell'UI con il chunk ricevuto
    console.log('🖥️ Aggiorna UI con chunk:', chunk);
  }
  
  private updateProgressiveText(fullText: string) {
    // Implementa l'aggiornamento progressivo del testo
    console.log('📝 Aggiorna testo progressivo:', fullText);
  }
  
  private processAudioChunk(audioData: ArrayBuffer, chunkNumber: number) {
    // Implementa elaborazione personalizzata dei chunk audio
    console.log(`🎵 Elabora chunk audio ${chunkNumber}:`, audioData.byteLength, 'bytes');
  }
}

/**
 * GUIDA ALL'INTEGRAZIONE
 * 
 * 1. MODALITÀ BASE (compatibilità):
 *    - Usa sendVoiceMessageToBotOptimized(audioUri, "base")
 *    - Comportamento simile alla versione originale ma con ottimizzazioni interne
 *    - Fallback automatico se streaming non supportato
 * 
 * 2. MODALITÀ ADVANCED (streaming):
 *    - Usa sendVoiceMessageToBotOptimized(audioUri, "advanced", onChunk, onAudio)
 *    - Streaming upload e playback in tempo reale
 *    - Callback per gestire chunk progressivi
 * 
 * 3. COMPATIBILITÀ:
 *    - Tutte le funzioni originali continuano a funzionare
 *    - Fallback automatico in caso di errori
 *    - Supporto React Native e Web
 * 
 * 4. REQUISITI SERVER:
 *    - Endpoint /chat_bot_voice_stream per streaming
 *    - Endpoint /capabilities per verificare supporto
 *    - Transfer-Encoding: chunked o WebSocket
 * 
 * 5. GESTIONE ERRORI:
 *    - Fallback automatico su metodo classico
 *    - Log dettagliati per debugging
 *    - Controllo compatibilità server
 */

export default VoiceBotOptimizedExample;
