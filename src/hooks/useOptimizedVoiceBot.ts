import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  sendVoiceMessageToBotOptimized, 
  sendVoiceMessageWithSmartHandling,
  diagnoseVoiceBotIssues,
  stopAllAudioStreams,
  sendVoiceMessageToBot 
} from '../services/botservice';

/**
 * Hook personalizzato per gestire il bot vocale ottimizzato
 * Fornisce un'interfaccia semplice per utilizzare le funzionalità di streaming
 */
export function useOptimizedVoiceBot() {
  // Stati per il controllo del bot
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [streamingProgress, setStreamingProgress] = useState('');
  const [audioChunksReceived, setAudioChunksReceived] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [performanceStats, setPerformanceStats] = useState({
    startTime: 0,
    endTime: 0,
    duration: 0,
    chunksReceived: 0,
    streamingMode: false
  });

  // Refs per gestire lo stato interno
  const processingRef = useRef(false);
  const chunksRef = useRef<string[]>([]);
  /**
   * 🚀 Invia messaggio vocale con modalità ottimizzata
   */
  const sendOptimizedVoiceMessage = useCallback(async (
    audioUri: string,
    modelType: "base" | "advanced" = "advanced",
    previousMessages: any[] = [],
    enableRealTimeUpdates: boolean = true
  ) => {
    if (processingRef.current) {
      console.warn('⚠️ Elaborazione già in corso, ignoro richiesta');
      return null;
    }

    // Reset stati
    setIsProcessing(true);
    setCurrentResponse('');
    setStreamingProgress('');
    setAudioChunksReceived(0);
    setLastError(null);
    chunksRef.current = [];
    processingRef.current = true;

    // Inizializza statistiche performance
    const startTime = Date.now();
    setPerformanceStats(prev => ({
      ...prev,
      startTime,
      chunksReceived: 0,
      streamingMode: modelType === "advanced"
    }));

    try {
      console.log(`🎤 Invio messaggio vocale ottimizzato (${modelType})...`);      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        modelType,
        previousMessages, // Passa i messaggi precedenti
        
        // Callback per chunk di testo (solo se real-time è abilitato)
        enableRealTimeUpdates ? (chunk: string) => {
          if (!processingRef.current) return;
          
          chunksRef.current.push(chunk);
          const progressText = chunksRef.current.join('');
          
          setStreamingProgress(progressText);
          setPerformanceStats(prev => ({
            ...prev,
            chunksReceived: prev.chunksReceived + 1
          }));
          
          console.log(`📝 Chunk ricevuto: ${chunk}`);
        } : undefined,
        
        // Callback per chunk audio
        enableRealTimeUpdates ? (audioData: ArrayBuffer) => {
          if (!processingRef.current) return;
          
          setAudioChunksReceived(prev => prev + 1);
          console.log(`🎵 Audio chunk ricevuto: ${audioData.byteLength} bytes`);
        } : undefined
      );

      // Finalizza statistiche
      const endTime = Date.now();
      setPerformanceStats(prev => ({
        ...prev,
        endTime,
        duration: endTime - startTime
      }));

      setCurrentResponse(response);
      console.log(`✅ Risposta ricevuta in ${endTime - startTime}ms:`, response);
      
      return response;

    } catch (error: any) {
      console.error('❌ Errore nel messaggio vocale ottimizzato:', error);
      setLastError(error.message || 'Errore sconosciuto');
      
      // Tenta fallback automatico
      try {
        console.log('🔄 Tentativo fallback...');
        const fallbackResponse = await sendVoiceMessageToBot(audioUri, modelType);
        setCurrentResponse(fallbackResponse);
        return fallbackResponse;
      } catch (fallbackError: any) {
        console.error('❌ Anche il fallback è fallito:', fallbackError);
        setLastError(fallbackError.message || 'Fallback fallito');
        return null;
      }
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, []);

  /**
   * 📊 Confronta performance tra modalità
   */
  const comparePerformance = useCallback(async (audioUri: string) => {
    const results = {
      base: { time: 0, success: false, response: '' },
      advanced: { time: 0, success: false, response: '' },
      chunks: { base: 0, advanced: 0 }
    };

    // Test modalità base
    try {
      setPerformanceStats(prev => ({ ...prev, streamingMode: false }));
      const startBase = Date.now();      const baseResponse = await sendOptimizedVoiceMessage(audioUri, "base", [], false);
      results.base.time = Date.now() - startBase;
      results.base.success = !!baseResponse;
      results.base.response = baseResponse || '';
      results.chunks.base = performanceStats.chunksReceived;
    } catch (error) {
      console.error('❌ Test base fallito:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // Pausa tra test

    // Test modalità advanced
    try {
      setPerformanceStats(prev => ({ ...prev, streamingMode: true }));
      const startAdvanced = Date.now();
      const advancedResponse = await sendOptimizedVoiceMessage(audioUri, "advanced", [], true);
      results.advanced.time = Date.now() - startAdvanced;
      results.advanced.success = !!advancedResponse;
      results.advanced.response = advancedResponse || '';
      results.chunks.advanced = performanceStats.chunksReceived;
    } catch (error) {
      console.error('❌ Test advanced fallito:', error);
    }

    // Calcola miglioramento
    const improvement = results.base.time > 0 && results.advanced.time > 0
      ? ((results.base.time - results.advanced.time) / results.base.time) * 100
      : 0;

    console.log('📈 RISULTATI CONFRONTO:');
    console.log(`Base: ${results.base.time}ms (${results.base.success ? 'OK' : 'FAIL'})`);
    console.log(`Advanced: ${results.advanced.time}ms (${results.advanced.success ? 'OK' : 'FAIL'})`);
    console.log(`Miglioramento: ${improvement.toFixed(1)}%`);

    return { ...results, improvement };
  }, [sendOptimizedVoiceMessage, performanceStats.chunksReceived]);

  /**
   * 🛑 Ferma tutti gli streaming
   */
  const stopStreaming = useCallback(() => {
    console.log('🛑 Fermando tutti gli streaming...');
    stopAllAudioStreams();
    processingRef.current = false;
    setIsProcessing(false);
    setStreamingProgress('');
  }, []);

  /**
   * 🔄 Reset stati
   */
  const resetStates = useCallback(() => {
    setCurrentResponse('');
    setStreamingProgress('');
    setAudioChunksReceived(0);
    setLastError(null);
    setPerformanceStats({
      startTime: 0,
      endTime: 0,
      duration: 0,
      chunksReceived: 0,
      streamingMode: false
    });
    chunksRef.current = [];
  }, []);

  // Cleanup automatico quando il componente viene smontato
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  // Calcola statistiche real-time
  const realtimeStats = {
    isStreaming: isProcessing && performanceStats.streamingMode,
    textChunksReceived: performanceStats.chunksReceived,
    audioChunksReceived,
    elapsedTime: performanceStats.startTime > 0 
      ? (performanceStats.endTime || Date.now()) - performanceStats.startTime 
      : 0,
    averageChunkTime: performanceStats.chunksReceived > 0 
      ? ((performanceStats.endTime || Date.now()) - performanceStats.startTime) / performanceStats.chunksReceived
      : 0
  };

  /**
   * 🧠 Invia messaggio vocale con gestione intelligente degli errori
   */
  const sendSmartVoiceMessage = useCallback(async (
    audioUri: string,
    modelType: "base" | "advanced" = "advanced",
    previousMessages: any[] = []
  ) => {
    if (processingRef.current) {
      console.warn('⚠️ Elaborazione già in corso, ignoro richiesta');
      return null;
    }

    // Reset stati
    setIsProcessing(true);
    setCurrentResponse('');
    setStreamingProgress('');
    setAudioChunksReceived(0);
    setLastError(null);
    chunksRef.current = [];
    processingRef.current = true;

    // Inizializza statistiche performance
    const startTime = Date.now();
    setPerformanceStats(prev => ({
      ...prev,
      startTime,
      chunksReceived: 0,
      streamingMode: modelType === "advanced"
    }));

    try {
      console.log(`🧠 Invio messaggio vocale con gestione intelligente (${modelType})...`);

      const result = await sendVoiceMessageWithSmartHandling(audioUri, {
        modelType,
        previousMessages,
        onProgress: (message) => {
          setStreamingProgress(message);
          console.log('📋 Progresso:', message);
        },
        onChunkReceived: (chunk) => {
          if (!processingRef.current) return;
          
          chunksRef.current.push(chunk);
          const progressText = chunksRef.current.join('');
          
          setStreamingProgress(progressText);
          setPerformanceStats(prev => ({
            ...prev,
            chunksReceived: prev.chunksReceived + 1
          }));
          
          console.log(`📝 Chunk ricevuto: ${chunk}`);
        },
        maxRetries: 2
      });

      // Finalizza statistiche
      const endTime = Date.now();
      setPerformanceStats(prev => ({
        ...prev,
        endTime,
        duration: endTime - startTime
      }));

      if (result.success) {
        setCurrentResponse(result.response);
        console.log(`✅ Risposta ricevuta in ${endTime - startTime}ms:`, result.response);
        
        // Log metadati aggiuntivi
        if (result.metadata) {
          console.log('📊 Metadati:', result.metadata);
        }
        
        return result.response;
      } else {
        setLastError(result.response);
        console.error('❌ Invio fallito:', result.response);
        
        // Se ci sono info diagnostiche, loggale
        if (result.metadata?.diagnosticInfo) {
          console.log('🔍 Info diagnostiche:', result.metadata.diagnosticInfo);
        }
        
        return null;
      }

    } catch (error: any) {
      console.error('❌ Errore nella gestione intelligente:', error);
      setLastError(error.message || 'Errore sconosciuto');
      return null;
    } finally {
      setIsProcessing(false);
      processingRef.current = false;
    }
  }, []);

  /**
   * 🔍 Esegue diagnostica del servizio
   */
  const runDiagnostics = useCallback(async (audioUri: string) => {
    setIsProcessing(true);
    setLastError(null);
    
    try {
      console.log('🔍 Eseguo diagnostica del servizio...');
      const diagnosis = await diagnoseVoiceBotIssues(audioUri);
      
      console.log('📋 Risultato diagnostica:', diagnosis);
      
      // Aggiorna gli stati con i risultati
      setCurrentResponse(`Diagnostica completata: ${diagnosis.diagnosis}`);
      setStreamingProgress(diagnosis.recommendations.join('. '));
      
      return diagnosis;
    } catch (error: any) {
      setLastError(error.message);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  return {
    // Funzioni principali
    sendOptimizedVoiceMessage,
    sendSmartVoiceMessage,
    runDiagnostics,
    comparePerformance,
    stopStreaming,
    resetStates,

    // Stati
    isProcessing,
    currentResponse,
    streamingProgress,
    audioChunksReceived,
    lastError,
    performanceStats,
    realtimeStats,

    // Utilities
    hasError: !!lastError,
    isStreamingActive: realtimeStats.isStreaming,
    progressPercentage: streamingProgress.length > 0 
      ? Math.min((streamingProgress.length / (currentResponse.length || 1)) * 100, 100)
      : 0
  };
}

/**
 * Hook semplificato per uso base
 */
export function useSimpleVoiceBot() {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const sendVoiceMessage = useCallback(async (
    audioUri: string,
    useStreaming: boolean = true,
    previousMessages: any[] = []
  ) => {
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const result = await sendVoiceMessageToBotOptimized(
        audioUri,
        useStreaming ? "advanced" : "base",
        previousMessages
      );
      
      setResponse(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendVoiceMessage,
    isLoading,
    response,
    error,
    hasError: !!error,
    resetError: () => setError(null)
  };
}
