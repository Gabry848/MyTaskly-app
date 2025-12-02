import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Utility per la gestione dell'audio nella chat vocale
 * Include registrazione, conversione base64, e riproduzione
 */

/**
 * Converte una stringa base64 in Uint8Array
 * Implementazione nativa per React Native (no atob/btoa)
 */
function decodeBase64(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  // Rimuove eventuali caratteri non-base64 (es. newline)
  const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  // Padding per lunghezza non multipla di 4 (comportamento analogo a Buffer.from)
  const padLength = (4 - (sanitized.length % 4)) % 4;
  const padded = sanitized.padEnd(sanitized.length + padLength, '=');

  // Calcola la lunghezza del buffer tenendo conto del padding
  let bufferLength = padded.length * 0.75;
  if (padded.endsWith('==')) bufferLength -= 2;
  else if (padded.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(bufferLength);
  let byteIndex = 0;

  for (let i = 0; i < padded.length; i += 4) {
    const a = chars.indexOf(padded[i]);
    const b = chars.indexOf(padded[i + 1]);
    const cChar = padded[i + 2];
    const dChar = padded[i + 3];

    const c = cChar === '=' ? 64 : chars.indexOf(cChar);
    const d = dChar === '=' ? 64 : chars.indexOf(dChar);

    const bitmap = (a << 18) | (b << 12) | ((c & 0x3f) << 6) | (d & 0x3f);

    bytes[byteIndex++] = (bitmap >> 16) & 0xff;
    if (c !== 64) bytes[byteIndex++] = (bitmap >> 8) & 0xff;
    if (d !== 64) bytes[byteIndex++] = bitmap & 0xff;
  }

  return bytes.subarray(0, byteIndex);
}

/**
 * Converte Uint8Array in stringa base64
 * Implementazione nativa per React Native (no atob/btoa)
 */
function encodeBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;

  while (i < bytes.length) {
    const a = bytes[i++];
    // Traccia quanti byte veri abbiamo per questo gruppo
    const hasB = i < bytes.length;
    const b = hasB ? bytes[i++] : 0;
    const hasC = i < bytes.length;
    const c = hasC ? bytes[i++] : 0;

    const bitmap = (a << 16) | (b << 8) | c;

    result += chars.charAt((bitmap >> 18) & 0x3f);
    result += chars.charAt((bitmap >> 12) & 0x3f);
    result += hasB ? chars.charAt((bitmap >> 6) & 0x3f) : '=';
    result += hasC ? chars.charAt(bitmap & 0x3f) : '=';
  }

  return result;
}

// Configurazioni audio
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  CHUNK_DURATION: 1000, // ms
  MAX_RECORDING_TIME: 60000, // 60 secondi
  AUDIO_FORMAT: Audio.RecordingOptionsPresets.HIGH_QUALITY.android.extension || 'm4a'
};

// Configurazioni VAD (Voice Activity Detection)
export const VAD_CONFIG = {
  SPEECH_THRESHOLD_DB: -50,        // dB sopra questa soglia = voce rilevata (più sensibile)
  SILENCE_THRESHOLD_DB: -60,       // dB sotto questa soglia = silenzio
  SILENCE_DURATION_MS: 1200,       // Durata silenzio prima di fermare (1.2s)
  METERING_POLL_INTERVAL_MS: 100,  // Intervallo controllo livello audio (100ms)
  MIN_RECORDING_DURATION_MS: 300,  // Durata minima registrazione prima di VAD (300ms)
};

// Configurazione per normalizzazione audio level
export const AUDIO_LEVEL_CONFIG = {
  MIN_DB: -80,  // Livello di silenzio tipico
  MAX_DB: -10,  // Livello di voce forte
};

// Configurazione per voice chat chunk flow control
export const VOICE_CHUNK_CONFIG = {
  // Minimum chunks to buffer before starting playback
  MIN_CHUNKS_BEFORE_PLAYBACK: 3,

  // Maximum wait time for chunks (ms) before starting with available
  MAX_BUFFER_WAIT_MS: 2000,

  // Burst detection threshold (inter-arrival time < this = burst)
  BURST_DETECTION_THRESHOLD_MS: 10,

  // Warning threshold for low buffer during playback
  LOW_BUFFER_WARNING_THRESHOLD: 1,
};

/**
 * Callback per eventi VAD
 */
export interface VADCallbacks {
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onSilenceDetected?: () => void;
  onAutoStop?: () => void;
  onMeteringUpdate?: (level: number) => void;
}

/**
 * Classe per gestire la registrazione audio
 */
export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;

  // VAD properties
  private meteringInterval: NodeJS.Timeout | null = null;
  private silenceStartTime: number | null = null;
  private vadEnabled: boolean = false;
  private vadCallbacks: VADCallbacks = {};
  private isSpeechDetected: boolean = false;

  /**
   * Inizializza e avvia la registrazione audio
   */
  async startRecording(enableVAD: boolean = false, vadCallbacks?: VADCallbacks): Promise<boolean> {
    console.log('🎙️ RECORDER: startRecording chiamato, VAD:', enableVAD);

    try {
      // Richiedi i permessi per il microfono
      console.log('🔐 RECORDER: Richiesta permessi microfono...');
      const { granted } = await Audio.requestPermissionsAsync();
      console.log('🔐 RECORDER: Permessi microfono:', granted ? '✅ Concessi' : '❌ Negati');

      if (!granted) {
        console.error('❌ RECORDER: Permessi microfono non concessi');
        return false;
      }

      // Configura la modalità audio per la registrazione
      console.log('⚙️ RECORDER: Configurazione modalità audio...');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ RECORDER: Modalità audio configurata');

      // Crea una nuova registrazione
      console.log('📼 RECORDER: Creazione istanza Recording...');
      this.recording = new Audio.Recording();

      // Configura le opzioni di registrazione con metering se VAD è abilitato
      const recordingOptions = {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: enableVAD,
      };
      console.log('⚙️ RECORDER: Opzioni registrazione:', recordingOptions);

      // Prepara e avvia la registrazione
      console.log('🎬 RECORDER: Preparazione registrazione...');
      await this.recording.prepareToRecordAsync(recordingOptions);
      console.log('✅ RECORDER: Registrazione preparata');

      console.log('▶️ RECORDER: Avvio registrazione...');
      await this.recording.startAsync();
      console.log('✅ RECORDER: Registrazione avviata!');

      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.vadEnabled = enableVAD;
      this.vadCallbacks = vadCallbacks || {};

      // Avvia il monitoraggio VAD se abilitato
      if (enableVAD) {
        console.log('🎚️ RECORDER: Avvio monitoraggio VAD...');
        this.startVADMonitoring();
      }

      console.log('🎤 Registrazione audio iniziata', enableVAD ? '(VAD attivo)' : '(VAD disattivo)');
      return true;

    } catch (error) {
      console.error('❌ RECORDER: Errore avvio registrazione:', error);
      console.error('❌ RECORDER: Stack trace:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Ferma la registrazione e restituisce i dati audio
   */
  async stopRecording(): Promise<string | null> {
    if (!this.recording || !this.isRecording) {
      console.warn('Nessuna registrazione attiva');
      return null;
    }

    try {
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) {
        console.error('URI della registrazione non disponibile');
        return null;
      }

      // Converti il file audio in base64
      const base64Data = await this.convertAudioToBase64(uri);
      
      this.isRecording = false;
      console.log('🎤 Registrazione completata');
      
      return base64Data;
      
    } catch (error) {
      console.error('Errore stop registrazione:', error);
      return null;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Converti un file audio in formato base64
   */
  private async convertAudioToBase64(audioUri: string): Promise<string | null> {
    try {
      console.log('🎤 Inizio conversione base64 per URI:', audioUri);
      
      // Verifica se FileSystem è disponibile
      if (!FileSystem || !FileSystem.readAsStringAsync) {
        console.error('FileSystem non disponibile o metodo readAsStringAsync mancante');
        return null;
      }
      
      // Verifica se l'URI esiste
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.error('File audio non esiste:', audioUri);
        return null;
      }
      
      console.log('🎤 File info:', fileInfo);
      
      // Leggiamo i primi bytes per verificare l'header del file
      const headerBytes = await this.readFileHeader(audioUri);
      console.log('🎤 Header bytes (primi 8):', headerBytes);
      
      // In React Native/Expo, usiamo FileSystem per leggere il file
      const base64Data = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('🎤 Conversione base64 completata, lunghezza:', base64Data?.length || 0);
      
      // Debug: verifica i primi caratteri del base64 per identificare il formato
      if (base64Data && base64Data.length > 20) {
        const first20chars = base64Data.substring(0, 20);
        console.log('🎤 Prime 20 chars base64:', first20chars);
        
        // Decodifica i primi bytes per vedere l'header
        const headerBase64 = base64Data.substring(0, 32); // primi ~24 bytes
        const headerBuffer = this.base64ToBytes(headerBase64);
        console.log('🎤 Header decodificato:', Array.from(headerBuffer).map(b => b.toString(16).padStart(2, '0')).join(' '));
      }
      
      return base64Data;
      
    } catch (error) {
      console.error('Errore conversione base64:', error);
      console.error('URI problematico:', audioUri);
      console.error('FileSystem disponibile:', !!FileSystem);
      console.error('readAsStringAsync disponibile:', !!(FileSystem?.readAsStringAsync));
      return null;
    }
  }

  /**
   * Ottieni la durata della registrazione corrente
   */
  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return Date.now() - this.recordingStartTime;
  }

  /**
   * Controlla se la registrazione è attiva
   */
  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Cancella la registrazione corrente
   */
  async cancelRecording(): Promise<void> {
    if (this.recording && this.isRecording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
        console.error('Errore cancellazione registrazione:', error);
      }
    }
    this.cleanup();
  }

  /**
   * Legge i primi bytes del file per verificare l'header
   */
  private async readFileHeader(audioUri: string): Promise<number[]> {
    try {
      // Leggiamo tutto il file in base64, poi prendiamo solo i primi bytes
      const fullBase64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Prendiamo solo i primi ~16 caratteri base64 (corrispondenti a ~12 bytes)
      const headerBase64 = fullBase64.substring(0, 16);
      const headerBytes = this.base64ToBytes(headerBase64);
      return Array.from(headerBytes).slice(0, 8);
    } catch (error) {
      console.error('Errore lettura header:', error);
      return [];
    }
  }

  /**
   * Converte base64 in array di bytes
   */
  private base64ToBytes(base64: string): Uint8Array {
    try {
      return decodeBase64(base64);
    } catch (error) {
      console.error('Errore conversione base64 to bytes:', error);
      return new Uint8Array(0);
    }
  }

  /**
   * Avvia il monitoraggio VAD
   */
  private startVADMonitoring(): void {
    this.meteringInterval = setInterval(async () => {
      if (!this.recording || !this.isRecording) {
        this.stopVADMonitoring();
        return;
      }

      try {
        const status = await this.recording.getStatusAsync();

        if (status.isRecording && status.metering !== undefined) {
          const meteringDB = status.metering;

          // Notifica aggiornamento livello audio
          this.vadCallbacks.onMeteringUpdate?.(meteringDB);

          // Processa il livello audio per VAD
          this.processMeteringLevel(meteringDB);
        }
      } catch (error) {
        console.error('Errore monitoraggio VAD:', error);
      }
    }, VAD_CONFIG.METERING_POLL_INTERVAL_MS);

    console.log('🎤 Monitoraggio VAD avviato');
  }

  /**
   * Ferma il monitoraggio VAD
   */
  private stopVADMonitoring(): void {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
      console.log('🎤 Monitoraggio VAD fermato');
    }
  }

  /**
   * Processa il livello audio per rilevare voce e silenzio
   */
  private processMeteringLevel(meteringDB: number): void {
    const recordingDuration = this.getRecordingDuration();

    // Log del livello audio ogni 500ms per debugging
    if (recordingDuration % 500 < VAD_CONFIG.METERING_POLL_INTERVAL_MS) {
      console.log(`📊 Audio Level: ${meteringDB.toFixed(1)} dB | Duration: ${(recordingDuration / 1000).toFixed(1)}s`);
    }

    // Non attivare VAD se la registrazione è troppo corta
    if (recordingDuration < VAD_CONFIG.MIN_RECORDING_DURATION_MS) {
      console.log(`⏱️ VAD: Attesa iniziale... (${recordingDuration}ms/${VAD_CONFIG.MIN_RECORDING_DURATION_MS}ms)`);
      return;
    }

    // Rilevamento voce
    if (meteringDB > VAD_CONFIG.SPEECH_THRESHOLD_DB) {
      if (!this.isSpeechDetected) {
        this.isSpeechDetected = true;
        this.vadCallbacks.onSpeechStart?.();
        console.log(`🎤 VAD: ✅ VOCE RILEVATA! (${meteringDB.toFixed(1)} dB > ${VAD_CONFIG.SPEECH_THRESHOLD_DB} dB)`);
      }

      // Reset timer silenzio quando si parla
      if (this.silenceStartTime) {
        console.log(`🔊 VAD: Voce continua, reset timer silenzio`);
        this.silenceStartTime = null;
      }
    }
    // Rilevamento silenzio
    else if (meteringDB < VAD_CONFIG.SILENCE_THRESHOLD_DB) {
      // Inizia timer silenzio
      if (!this.silenceStartTime) {
        this.silenceStartTime = Date.now();
        this.vadCallbacks.onSilenceDetected?.();
        console.log(`🔇 VAD: ⏸️ SILENZIO RILEVATO (${meteringDB.toFixed(1)} dB < ${VAD_CONFIG.SILENCE_THRESHOLD_DB} dB)`);
      } else {
        const silenceDuration = Date.now() - this.silenceStartTime;

        // Log progressivo del silenzio
        if (silenceDuration % 300 < VAD_CONFIG.METERING_POLL_INTERVAL_MS) {
          console.log(`⏱️ VAD: Silenzio da ${(silenceDuration / 1000).toFixed(1)}s (stop a ${(VAD_CONFIG.SILENCE_DURATION_MS / 1000).toFixed(1)}s)`);
        }

        // Se il silenzio dura abbastanza, ferma la registrazione
        if (silenceDuration >= VAD_CONFIG.SILENCE_DURATION_MS && this.isSpeechDetected) {
          console.log(`🛑 VAD: ⏹️ AUTO-STOP ATTIVATO! (silenzio prolungato ${(silenceDuration / 1000).toFixed(1)}s)`);
          this.vadCallbacks.onAutoStop?.();
          this.vadCallbacks.onSpeechEnd?.();
        }
      }
    }
    // Zona intermedia (tra soglia silenzio e soglia voce)
    else {
      console.log(`📍 VAD: Zona intermedia (${meteringDB.toFixed(1)} dB tra ${VAD_CONFIG.SILENCE_THRESHOLD_DB} e ${VAD_CONFIG.SPEECH_THRESHOLD_DB})`);
    }
  }

  /**
   * Pulisce le risorse della registrazione
   */
  private cleanup(): void {
    this.stopVADMonitoring();
    this.recording = null;
    this.isRecording = false;
    this.recordingStartTime = 0;
    this.silenceStartTime = null;
    this.vadEnabled = false;
    this.isSpeechDetected = false;
  }
}

/**
 * Classe per gestire la riproduzione audio con streaming
 */
export class AudioPlayer {
  private currentSound: Audio.Sound | null = null;
  private chunkBuffer: Array<{ index?: number; data: string }> = [];
  private seenChunkIndexes: Set<number> = new Set();
  private highestIndexedChunk: number = -1;
  private isPlaying: boolean = false;
  private onCompleteCallback: (() => void) | null = null;

  // Buffer state tracking per diagnostica
  private lastChunkReceivedTime: number = 0;
  private chunkArrivalTimes: number[] = [];
  private bufferStartTime: number = 0;
  private isBufferingStarted: boolean = false;

  constructor() {}

  /**
   * Converte base64 in array di bytes
   */
  private base64ToBytes(base64: string): Uint8Array {
    try {
      return decodeBase64(base64);
    } catch (error) {
      console.error('Errore conversione base64 to bytes:', error);
      return new Uint8Array(0);
    }
  }

  /**
   * Converte bytes in base64
   */
  private bytesToBase64(bytes: Uint8Array): string {
    try {
      return encodeBase64(bytes);
    } catch (error) {
      console.error('Errore conversione bytes to base64:', error);
      return '';
    }
  }

  /**
   * Tenta di individuare il formato audio dai primi bytes
   */
  private detectAudioFormat(data: Uint8Array): 'wav' | 'mp3' | 'm4a' | 'ogg' | 'unknown' {
    if (data.length < 12) return 'unknown';

    // RIFF/WAVE
    if (
      data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
      data[8] === 0x57 && data[9] === 0x41 && data[10] === 0x56 && data[11] === 0x45
    ) {
      return 'wav';
    }

    // MP3 (ID3 tag o frame sync 0xfff*)
    if (
      (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) || // ID3
      (data[0] === 0xff && (data[1] & 0xe0) === 0xe0) // frame sync
    ) {
      return 'mp3';
    }

    // OGG
    if (data[0] === 0x4f && data[1] === 0x67 && data[2] === 0x67 && data[3] === 0x53) {
      return 'ogg';
    }

    // MP4/M4A (ftyp atom)
    if (
      data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70 &&
      data[8] === 0x4d && data[9] === 0x34 && data[10] === 0x41
    ) {
      return 'm4a';
    }

    return 'unknown';
  }

  /**
   * Controlla se il buffer è pronto per la riproduzione
   * Ritorna true se abbiamo almeno MIN_CHUNKS_BEFORE_PLAYBACK chunk
   */
  isReadyToPlay(): boolean {
    const bufferedCount = this.getBufferedChunksCount();
    const isReady = bufferedCount >= VOICE_CHUNK_CONFIG.MIN_CHUNKS_BEFORE_PLAYBACK;

    if (!isReady && bufferedCount > 0) {
      console.log(`🔊 Buffer non pronto: ${bufferedCount}/${VOICE_CHUNK_CONFIG.MIN_CHUNKS_BEFORE_PLAYBACK} chunk`);
    }

    return isReady;
  }

  /**
   * Ottiene il numero di chunk attualmente nel buffer
   */
  getBufferedChunksCount(): number {
    return this.chunkBuffer.length;
  }

  /**
   * Ottiene statistiche sull'arrivo dei chunk
   */
  getChunkArrivalStatistics(): {
    totalReceived: number;
    averageInterArrivalMs: number;
    minInterArrivalMs: number;
    maxInterArrivalMs: number;
    bursts: number;
  } | null {
    if (this.chunkArrivalTimes.length < 2) return null;

    const interArrivals: number[] = [];
    for (let i = 1; i < this.chunkArrivalTimes.length; i++) {
      interArrivals.push(this.chunkArrivalTimes[i] - this.chunkArrivalTimes[i - 1]);
    }

    const burstCount = interArrivals.filter(
      time => time < VOICE_CHUNK_CONFIG.BURST_DETECTION_THRESHOLD_MS
    ).length;

    const avgInterArrival = interArrivals.reduce((a, b) => a + b, 0) / interArrivals.length;

    return {
      totalReceived: this.chunkArrivalTimes.length,
      averageInterArrivalMs: avgInterArrival,
      minInterArrivalMs: Math.min(...interArrivals),
      maxInterArrivalMs: Math.max(...interArrivals),
      bursts: burstCount,
    };
  }

  /**
   * Riproduce audio da dati base64 concatenati
   */
  async playAudioFromBase64(base64Data: string, onComplete?: () => void): Promise<boolean> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const tempUri = `${FileSystem.documentDirectory}temp_audio_${Date.now()}.m4a`;

      await FileSystem.writeAsStringAsync(tempUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: tempUri });
      this.currentSound = sound;

      this.currentSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('🔊 Riproduzione completata');
          this.onPlaybackComplete(onComplete);
        }
      });

      await this.currentSound.playAsync();
      this.isPlaying = true;

      console.log('🔊 Riproduzione audio iniziata');
      return true;

    } catch (error) {
      console.error('🔊 Errore riproduzione audio:', error);
      return false;
    }
  }

  /**
   * Aggiunge un chunk alla collezione
   */
  addChunk(base64Data: string, chunkIndex?: number): boolean {
    const currentTime = Date.now();

    // Traccia timing arrivo chunk (per prima volta)
    if (!this.isBufferingStarted) {
      this.isBufferingStarted = true;
      this.bufferStartTime = currentTime;
      console.log(`🔊 ⏱️ INIZIO BUFFERING chunk audio`);
    }

    // Traccia inter-arrival time
    if (this.lastChunkReceivedTime > 0) {
      const interArrivalMs = currentTime - this.lastChunkReceivedTime;
      this.chunkArrivalTimes.push(currentTime);

      if (interArrivalMs < VOICE_CHUNK_CONFIG.BURST_DETECTION_THRESHOLD_MS) {
        console.warn(`🔊 ⚡ BURST RILEVATO: ${interArrivalMs}ms tra chunk`);
      }
    } else {
      this.chunkArrivalTimes.push(currentTime);
    }

    this.lastChunkReceivedTime = currentTime;

    if (typeof chunkIndex === 'number') {
      if (this.seenChunkIndexes.has(chunkIndex)) {
        console.warn(`🔊 Chunk duplicato ricevuto (indice ${chunkIndex}) - ignorato`);
        return false;
      }

      if (this.highestIndexedChunk >= 0 && chunkIndex > this.highestIndexedChunk + 1) {
        console.warn(`🔊 Mancano uno o più chunk prima dell'indice ${chunkIndex} (ultimo ricevuto ${this.highestIndexedChunk})`);
      }

      if (this.highestIndexedChunk >= 0 && chunkIndex < this.highestIndexedChunk) {
        console.warn(`🔊 Chunk fuori ordine rilevato: indice ${chunkIndex} ricevuto dopo ${this.highestIndexedChunk}`);
      }

      this.seenChunkIndexes.add(chunkIndex);
      this.highestIndexedChunk = Math.max(this.highestIndexedChunk, chunkIndex);
    }

    this.chunkBuffer.push({ index: chunkIndex, data: base64Data });
    const bufferedCount = this.getChunksCount();
    console.log(`🔊 Chunk #${typeof chunkIndex === 'number' ? chunkIndex : '?'} aggiunto. Buffer: ${bufferedCount}/${VOICE_CHUNK_CONFIG.MIN_CHUNKS_BEFORE_PLAYBACK}`);

    return true;
  }

  /**
   * Unisce TUTTI i chunk in un singolo file, poi lo riproduce
   * Salva il file concatenato su disco prima di riprodurre
   */
  
  async playChunksSequentially(onComplete?: () => void): Promise<boolean> {
    const totalChunks = this.getChunksCount();

    if (totalChunks === 0) {
      console.log('AudioPlayer: Nessun chunk da riprodurre');
      return false;
    }

    console.log(`AudioPlayer: Unione di ${totalChunks} chunk in corso...`);

    try {
      const indexedChunks = this.chunkBuffer
        .filter(chunk => typeof chunk.index === 'number')
        .sort((a, b) => (a.index as number) - (b.index as number));
      const nonIndexedChunks = this.chunkBuffer.filter(chunk => typeof chunk.index !== 'number');

      const playbackQueue = [...indexedChunks, ...nonIndexedChunks];

      if (playbackQueue.length === 0) {
        console.warn('AudioPlayer: Nessun chunk valido da riprodurre');
        this.clearChunks();
        return false;
      }

      console.log('AudioPlayer: Step 1, decodifica chunk base64 e concatenazione binari...');

      // Decodifica OGNI chunk base64 completamente a binario
      const binaryChunks: Uint8Array[] = [];
      for (const chunk of playbackQueue) {
        const binaryData = this.base64ToBytes(chunk.data);
        if (binaryData.length > 0) {
          binaryChunks.push(binaryData);
          console.log(`  Chunk decodificato: ${binaryData.length} bytes`);
        }
      }

      if (binaryChunks.length === 0) {
        console.warn('AudioPlayer: Nessun chunk valido da decodificare');
        this.clearChunks();
        return false;
      }

      // Concatena i binari usando Uint8Array.set()
      const totalBinaryLength = binaryChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const totalBinaryData = new Uint8Array(totalBinaryLength);
      let offset = 0;

      binaryChunks.forEach((chunk) => {
        totalBinaryData.set(chunk, offset);
        offset += chunk.length;
      });

      console.log(`AudioPlayer: Step 1 completato (${totalBinaryData.length} bytes binari da ${binaryChunks.length} chunk)`);

      const detectedFormat = this.detectAudioFormat(totalBinaryData);
      const extension = detectedFormat === 'unknown' ? 'm4a' : detectedFormat;
      if (detectedFormat === 'unknown') {
        console.warn('AudioPlayer: Formato audio non rilevato, uso fallback .m4a');
      } else {
        console.log(`AudioPlayer: Formato audio rilevato -> ${detectedFormat}`);
      }

      console.log(`AudioPlayer: Dati audio decodificati (${totalBinaryData.length} bytes)`);

      console.log('AudioPlayer: Step 2, salvataggio file audio concatenato...');
      const finalAudioPath = `${FileSystem.documentDirectory}final_audio_${Date.now()}.${extension}`;

      // Riencodifica a base64 per scrivere il file (richiesto da FileSystem)
      const finalBase64 = this.bytesToBase64(totalBinaryData);

      await FileSystem.writeAsStringAsync(finalAudioPath, finalBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log(`AudioPlayer: Step 2 completato (file: ${finalAudioPath.split('/').pop()})`);

      console.log('AudioPlayer: Step 3, avvio riproduzione file concatenato...');

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: finalAudioPath });
      this.currentSound = sound;

      this.currentSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('AudioPlayer: Riproduzione completata');
          try {
            await this.currentSound?.unloadAsync();
          } catch (e) {
            console.warn('AudioPlayer: Errore unload audio');
          }

          try {
            await FileSystem.deleteAsync(finalAudioPath);
            console.log('AudioPlayer: File temporaneo eliminato');
          } catch (e) {
            console.warn('AudioPlayer: Errore eliminazione file temporaneo');
          }

          this.clearChunks();
          onComplete?.();
        }
      });

      await this.currentSound.playAsync();
      this.isPlaying = true;
      console.log('AudioPlayer: Step 3 completato, riproduzione avviata');

      return true;
    } catch (error) {
      console.error('AudioPlayer: Errore durante la riproduzione concatenata:', error);
      this.clearChunks();
      return false;
    }
  }

  /**
   * Concatena tutti i chunk e li riproduce

   * Salva i chunk in un singolo file e lo riproduce
   */
  
  async playAllChunks(onComplete?: () => void): Promise<boolean> {
    const totalChunks = this.getChunksCount();

    if (totalChunks === 0) {
      console.log('AudioPlayer: Nessun chunk da riprodurre');
      return false;
    }

    const stats = this.getChunkArrivalStatistics();
    console.log('AudioPlayer: Stato buffer per playback');
    console.log(`  - Total chunks: ${totalChunks}`);
    if (stats) {
      console.log(`  - Avg inter-arrival: ${stats.averageInterArrivalMs.toFixed(2)}ms`);
      console.log(`  - Min/Max: ${stats.minInterArrivalMs}ms / ${stats.maxInterArrivalMs}ms`);
      console.log(`  - Burst events: ${stats.bursts}`);
    }
    if (this.isBufferingStarted) {
      const bufferDuration = this.lastChunkReceivedTime - this.bufferStartTime;
      console.log(`  - Buffer duration: ${bufferDuration}ms`);
    }

    console.log(`AudioPlayer: Inizio concatenazione di ${totalChunks} chunks...`);

    try {
      const indexedChunks = this.chunkBuffer
        .filter(chunk => typeof chunk.index === 'number')
        .sort((a, b) => (a.index as number) - (b.index as number));
      const nonIndexedChunks = this.chunkBuffer.filter(chunk => typeof chunk.index !== 'number');

      if (indexedChunks.length > 1) {
        const sortedIndexes = indexedChunks.map(chunk => chunk.index as number);
        for (let i = 1; i < sortedIndexes.length; i++) {
          const expected = sortedIndexes[i - 1] + 1;
          if (sortedIndexes[i] !== expected) {
            if (sortedIndexes[i] < expected) {
              console.warn(`AudioPlayer: Ordine chunk non crescente: indice ${sortedIndexes[i]} dopo ${sortedIndexes[i - 1]}`);
            } else {
              console.warn(`AudioPlayer: Mancano ${sortedIndexes[i] - expected} chunk audio prima dell'indice ${sortedIndexes[i]}`);
            }
          }
        }
      }

      const playbackQueue = [...indexedChunks, ...nonIndexedChunks];

      if (playbackQueue.length === 0) {
        console.warn('AudioPlayer: Nessun chunk valido da riprodurre dopo il filtraggio');
        this.clearChunks();
        return false;
      }

      console.log('AudioPlayer: Decodifica chunk base64 e concatenazione binari...');

      // Decodifica OGNI chunk base64 completamente a binario
      const binaryChunks: Uint8Array[] = [];
      let processedChunkCount = 0;

      for (const chunk of playbackQueue) {
        try {
          const binaryData = this.base64ToBytes(chunk.data);

          if (binaryData.length === 0) {
            console.warn(`AudioPlayer: Chunk ${chunk.index ?? processedChunkCount} vuoto, ignorato`);
            continue;
          }

          binaryChunks.push(binaryData);
          processedChunkCount++;
          console.log(`AudioPlayer: Chunk ${chunk.index ?? processedChunkCount} decodificato (${binaryData.length} bytes)`);
        } catch (chunkError) {
          console.warn(`AudioPlayer: Errore decodifica chunk ${chunk.index ?? processedChunkCount}:`, chunkError);
        }
      }

      if (binaryChunks.length === 0) {
        console.warn('AudioPlayer: Nessun chunk audio valido dopo la decodifica');
        this.clearChunks();
        return false;
      }

      // Concatena i binari usando Uint8Array.set()
      const totalBinaryLength = binaryChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const totalBinaryData = new Uint8Array(totalBinaryLength);
      let offset = 0;

      binaryChunks.forEach((chunk) => {
        totalBinaryData.set(chunk, offset);
        offset += chunk.length;
      });

      const detectedFormat = this.detectAudioFormat(totalBinaryData);
      const extension = detectedFormat === 'unknown' ? 'm4a' : detectedFormat;
      if (detectedFormat === 'unknown') {
        console.warn('AudioPlayer: Formato audio non rilevato, uso fallback .m4a');
      } else {
        console.log(`AudioPlayer: Formato audio rilevato -> ${detectedFormat}`);
      }

      const finalAudioPath = `${FileSystem.documentDirectory}final_audio_${Date.now()}.${extension}`;
      const completeAudioBase64 = this.bytesToBase64(totalBinaryData);

      console.log('AudioPlayer: Audio concatenato pronto:');
      console.log(`  - Chunks elaborati: ${binaryChunks.length}`);
      console.log(`  - Dimensione binaria: ${totalBinaryData.length} bytes`);
      console.log(`  - Dimensione base64: ${completeAudioBase64.length} caratteri`);
      console.log(`  - Salvataggio file: ${finalAudioPath.split('/').pop()}`);

      await FileSystem.writeAsStringAsync(finalAudioPath, completeAudioBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      this.clearChunks();

      console.log('AudioPlayer: Riproduzione file audio...');

      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync({ uri: finalAudioPath });
        this.currentSound = sound;

        this.currentSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            console.log('AudioPlayer: Riproduzione completata');
            this.onPlaybackComplete(onComplete, finalAudioPath);
          }
        });

        await this.currentSound.playAsync();
        this.isPlaying = true;
        console.log('AudioPlayer: Riproduzione audio iniziata');
        return true;
      } catch (error) {
        console.error('AudioPlayer: Errore riproduzione:', error);

        try {
          await FileSystem.deleteAsync(finalAudioPath);
        } catch {
          console.warn('AudioPlayer: Errore eliminazione file temporaneo');
        }
        return false;
      }

    } catch (error) {
      console.error('AudioPlayer: Errore concatenazione:', error);
      this.clearChunks();
      return false;
    }
  }

  /**
   * Svuota i chunk accumulati

   */
  clearChunks(): void {
    this.chunkBuffer = [];
    this.seenChunkIndexes.clear();
    this.highestIndexedChunk = -1;

    // Reset timing per prossimo ciclo
    this.lastChunkReceivedTime = 0;
    this.chunkArrivalTimes = [];
    this.bufferStartTime = 0;
    this.isBufferingStarted = false;

    console.log('🔊 Chunks svuotati e timing reset');
  }

  /**
   * Gestisce il completamento della riproduzione
   */
  private async onPlaybackComplete(onComplete?: () => void, audioFilePath?: string): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('🔊 Errore cleanup audio:', error);
      }
      this.currentSound = null;
    }

    // Pulisci il file audio temporaneo
    if (audioFilePath) {
      try {
        await FileSystem.deleteAsync(audioFilePath);
        console.log('🔊 File audio temporaneo eliminato');
      } catch {
        console.warn('🔊 Errore eliminazione file audio temporaneo');
      }
    }

    this.isPlaying = false;

    if (onComplete) {
      onComplete();
    }
  }

  /**
   * Ferma la riproduzione corrente
   */
  async stopPlayback(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        console.log('🔊 Riproduzione fermata');
      } catch (error) {
        console.error('Errore stop riproduzione:', error);
      }
      this.currentSound = null;
    }

    this.isPlaying = false;
    this.onCompleteCallback = null;
  }

  /**
   * Controlla se la riproduzione è attiva
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Ottiene il numero di chunk accumulati
   */
  getChunksCount(): number {
    return this.chunkBuffer.length;
  }

  /**
   * Distrugge il player e pulisce tutte le risorse
   */
  async destroy(): Promise<void> {
    await this.stopPlayback();
    this.clearChunks();
  }
}

/**
 * Utility per convertire ArrayBuffer in base64
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return encodeBase64(bytes);
}

/**
 * Utility per convertire base64 in ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const bytes = decodeBase64(base64);
  return bytes.buffer;
}

/**
 * Valida i permessi audio
 */
export async function checkAudioPermissions(): Promise<boolean> {
  try {
    const { status } = await Audio.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Errore controllo permessi audio:', error);
    return false;
  }
}

/**
 * Formatta la durata in mm:ss
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
