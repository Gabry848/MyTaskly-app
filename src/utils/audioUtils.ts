import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Utility per la gestione dell'audio nella chat vocale
 * Include registrazione, conversione base64, e riproduzione
 */

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

  constructor() {}

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
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
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
  private audioChunks: string[] = [];
  private isPlaying: boolean = false;
  private onCompleteCallback: (() => void) | null = null;

  constructor() {}

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
  addChunk(base64Data: string): void {
    this.audioChunks.push(base64Data);
    console.log(`🔊 Chunk aggiunto. Totale chunks: ${this.audioChunks.length}`);
  }

  /**
   * Concatena tutti i chunk e li riproduce
   */
  async playAllChunks(onComplete?: () => void): Promise<boolean> {
    if (this.audioChunks.length === 0) {
      console.log('🔊 Nessun chunk da riprodurre');
      return false;
    }

    console.log(`🔊 Inizio concatenazione di ${this.audioChunks.length} chunks...`);

    try {
      let totalBinaryData = '';

      for (let i = 0; i < this.audioChunks.length; i++) {
        try {
          const chunk = this.audioChunks[i];
          const binaryChunk = atob(chunk);
          totalBinaryData += binaryChunk;
        } catch (chunkError) {
          console.warn(`🔊 Errore decodifica chunk ${i}:`, chunkError);
        }
      }

      const completeAudioBase64 = btoa(totalBinaryData);

      console.log(`🔊 Audio concatenato:`);
      console.log(`  - Chunks elaborati: ${this.audioChunks.length}`);
      console.log(`  - Dimensione binaria: ${totalBinaryData.length} bytes`);
      console.log(`  - Dimensione base64: ${completeAudioBase64.length} caratteri`);

      this.audioChunks = [];

      return await this.playAudioFromBase64(completeAudioBase64, onComplete);

    } catch (error) {
      console.error('🔊 Errore concatenazione/riproduzione:', error);
      this.audioChunks = [];
      return false;
    }
  }

  /**
   * Svuota i chunk accumulati
   */
  clearChunks(): void {
    this.audioChunks = [];
    console.log('🔊 Chunks svuotati');
  }

  /**
   * Gestisce il completamento della riproduzione
   */
  private async onPlaybackComplete(onComplete?: () => void): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('🔊 Errore cleanup audio:', error);
      }
      this.currentSound = null;
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
    return this.audioChunks.length;
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
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Utility per convertire base64 in ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
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
