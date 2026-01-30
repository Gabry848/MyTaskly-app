import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

/**
 * Utility per la gestione dell'audio nella chat vocale
 * Supporta il formato PCM16 a 24kHz richiesto dall'OpenAI Realtime API
 */

/**
 * Converte una stringa base64 in Uint8Array
 * Implementazione nativa per React Native (no atob/btoa)
 */
function decodeBase64(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const sanitized = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  const padLength = (4 - (sanitized.length % 4)) % 4;
  const padded = sanitized.padEnd(sanitized.length + padLength, '=');

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

// Configurazioni audio per OpenAI Realtime API
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 24000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_RECORDING_TIME: 300000, // 5 minuti per sessioni conversazionali
};

// Configurazioni VAD (Voice Activity Detection) - solo per feedback UI
// Il server gestisce il turn detection con semantic VAD
export const VAD_CONFIG = {
  SPEECH_THRESHOLD_DB: -60,
  SILENCE_THRESHOLD_DB: -70,
  SILENCE_DURATION_MS: 1200,
  METERING_POLL_INTERVAL_MS: 100,
  MIN_RECORDING_DURATION_MS: 500,
};

// Configurazione per normalizzazione audio level
export const AUDIO_LEVEL_CONFIG = {
  MIN_DB: -80,
  MAX_DB: -10,
};

/**
 * Crea un header WAV per dati audio PCM16.
 * Necessario perche' expo-av richiede un formato file per la riproduzione.
 */
export function createWavHeader(
  pcm16DataLength: number,
  sampleRate: number = 24000,
  channels: number = 1,
  bitsPerSample: number = 16
): Uint8Array {
  const header = new Uint8Array(44);
  const view = new DataView(header.buffer);

  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const fileSize = 36 + pcm16DataLength;

  // "RIFF" chunk descriptor
  header.set([0x52, 0x49, 0x46, 0x46], 0); // "RIFF"
  view.setUint32(4, fileSize, true);
  header.set([0x57, 0x41, 0x56, 0x45], 8); // "WAVE"

  // "fmt " sub-chunk
  header.set([0x66, 0x6d, 0x74, 0x20], 12); // "fmt "
  view.setUint32(16, 16, true);              // sub-chunk size (16 for PCM)
  view.setUint16(20, 1, true);               // audio format (1 = PCM)
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // "data" sub-chunk
  header.set([0x64, 0x61, 0x74, 0x61], 36); // "data"
  view.setUint32(40, pcm16DataLength, true);

  return header;
}

/**
 * Wrappa dati PCM16 raw con un header WAV.
 * Restituisce un file WAV completo come Uint8Array.
 */
export function wrapPcm16InWav(pcm16Data: Uint8Array, sampleRate: number = 24000): Uint8Array {
  const header = createWavHeader(pcm16Data.length, sampleRate);
  const wav = new Uint8Array(header.length + pcm16Data.length);
  wav.set(header, 0);
  wav.set(pcm16Data, header.length);
  return wav;
}

/**
 * Rimuove l'header WAV (44 bytes) da dati audio, restituendo PCM16 raw.
 */
function stripWavHeader(bytes: Uint8Array): Uint8Array {
  if (bytes.length > 44 &&
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45) {
    return bytes.subarray(44);
  }
  return bytes;
}

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
 * Opzioni di registrazione per PCM16 WAV a 24kHz
 */
function getPcm16RecordingOptions(enableMetering: boolean) {
  return {
    isMeteringEnabled: enableMetering,
    android: {
      extension: '.wav',
      outputFormat: 0, // AndroidOutputFormat.DEFAULT
      audioEncoder: 0, // AndroidAudioEncoder.DEFAULT
      sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      numberOfChannels: AUDIO_CONFIG.CHANNELS,
      bitRate: AUDIO_CONFIG.SAMPLE_RATE * AUDIO_CONFIG.BIT_DEPTH * AUDIO_CONFIG.CHANNELS,
    },
    ios: {
      extension: '.wav',
      outputFormat: Audio.IOSOutputFormat.LINEARPCM,
      audioQuality: Audio.IOSAudioQuality.HIGH,
      sampleRate: AUDIO_CONFIG.SAMPLE_RATE,
      numberOfChannels: AUDIO_CONFIG.CHANNELS,
      bitRate: AUDIO_CONFIG.SAMPLE_RATE * AUDIO_CONFIG.BIT_DEPTH * AUDIO_CONFIG.CHANNELS,
      linearPCMBitDepth: AUDIO_CONFIG.BIT_DEPTH,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
    web: {
      mimeType: 'audio/wav',
      bitsPerSecond: AUDIO_CONFIG.SAMPLE_RATE * AUDIO_CONFIG.BIT_DEPTH * AUDIO_CONFIG.CHANNELS,
    },
  };
}

/**
 * Classe per gestire la registrazione audio in formato PCM16
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
   * Avvia la registrazione audio in formato PCM16 WAV a 24kHz
   */
  async startRecording(enableVAD: boolean = false, vadCallbacks?: VADCallbacks): Promise<boolean> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.error('Permessi microfono non concessi');
        return false;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const recordingOptions = getPcm16RecordingOptions(enableVAD);
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;

      // Verifica che il recorder nativo sia effettivamente attivo
      const status = await this.recording.getStatusAsync();
      if (!status.isRecording) {
        console.error('Il recorder nativo non è partito correttamente');
        this.cleanup();
        return false;
      }

      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.vadEnabled = enableVAD;
      this.vadCallbacks = vadCallbacks || {};

      if (enableVAD) {
        this.startVADMonitoring();
      }

      console.log('Registrazione PCM16 avviata', enableVAD ? '(VAD attivo)' : '');
      return true;

    } catch (error) {
      console.error('Errore avvio registrazione:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Ferma la registrazione e restituisce i dati PCM16 raw in base64
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

      const base64Data = await this.convertToRawPcm16Base64(uri);
      this.isRecording = false;
      console.log('Registrazione completata');
      return base64Data;

    } catch (error) {
      console.error('Errore stop registrazione:', error);
      return null;
    } finally {
      this.cleanup();
    }
  }

  /**
   * Legge il file audio e restituisce PCM16 raw (senza header WAV) in base64
   */
  private async convertToRawPcm16Base64(audioUri: string): Promise<string | null> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        console.error('File audio non esiste:', audioUri);
        return null;
      }

      const base64Data = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!base64Data) return null;

      // Decodifica, rimuovi header WAV se presente, riencodifica
      const fullBytes = decodeBase64(base64Data);
      const pcm16Bytes = stripWavHeader(fullBytes);
      const pcm16Base64 = encodeBase64(pcm16Bytes);

      console.log(`Audio convertito: ${fullBytes.length} bytes -> ${pcm16Bytes.length} bytes PCM16 raw`);
      return pcm16Base64;

    } catch (error) {
      console.error('Errore conversione PCM16:', error);
      return null;
    }
  }

  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return Date.now() - this.recordingStartTime;
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

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
          this.vadCallbacks.onMeteringUpdate?.(meteringDB);
          this.processMeteringLevel(meteringDB);
        }
      } catch (error) {
        // Il recorder nativo non è più disponibile, ferma il monitoraggio
        console.warn('VAD: recorder non disponibile, monitoraggio fermato');
        this.stopVADMonitoring();
      }
    }, VAD_CONFIG.METERING_POLL_INTERVAL_MS);
  }

  private stopVADMonitoring(): void {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
  }

  private processMeteringLevel(meteringDB: number): void {
    const recordingDuration = this.getRecordingDuration();

    if (recordingDuration < VAD_CONFIG.MIN_RECORDING_DURATION_MS) {
      return;
    }

    // Rilevamento voce
    if (meteringDB > VAD_CONFIG.SPEECH_THRESHOLD_DB) {
      if (!this.isSpeechDetected) {
        this.isSpeechDetected = true;
        this.vadCallbacks.onSpeechStart?.();
      }
      if (this.silenceStartTime) {
        this.silenceStartTime = null;
      }
    }
    // Rilevamento silenzio
    else if (meteringDB < VAD_CONFIG.SILENCE_THRESHOLD_DB) {
      if (!this.silenceStartTime) {
        this.silenceStartTime = Date.now();
        this.vadCallbacks.onSilenceDetected?.();
      } else {
        const silenceDuration = Date.now() - this.silenceStartTime;
        if (silenceDuration >= VAD_CONFIG.SILENCE_DURATION_MS && this.isSpeechDetected) {
          this.vadCallbacks.onAutoStop?.();
          this.vadCallbacks.onSpeechEnd?.();
        }
      }
    }
  }

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
 * Classe per gestire la riproduzione di chunk audio PCM16
 */
export class AudioPlayer {
  private currentSound: Audio.Sound | null = null;
  private chunkBuffer: { index?: number; data: string }[] = [];
  private seenChunkIndexes: Set<number> = new Set();
  private highestIndexedChunk: number = -1;
  private isPlaying: boolean = false;

  /**
   * Aggiunge un chunk PCM16 base64 al buffer
   */
  addChunk(base64Data: string, chunkIndex?: number): boolean {
    if (typeof chunkIndex === 'number') {
      if (this.seenChunkIndexes.has(chunkIndex)) {
        console.warn(`Chunk duplicato (indice ${chunkIndex}) - ignorato`);
        return false;
      }

      if (this.highestIndexedChunk >= 0 && chunkIndex < this.highestIndexedChunk) {
        console.warn(`Chunk fuori ordine: indice ${chunkIndex} dopo ${this.highestIndexedChunk}`);
      }

      this.seenChunkIndexes.add(chunkIndex);
      this.highestIndexedChunk = Math.max(this.highestIndexedChunk, chunkIndex);
    }

    this.chunkBuffer.push({ index: chunkIndex, data: base64Data });
    return true;
  }

  /**
   * Concatena tutti i chunk PCM16, li wrappa in WAV e li riproduce
   */
  async playPcm16Chunks(onComplete?: () => void): Promise<boolean> {
    const totalChunks = this.getChunksCount();
    if (totalChunks === 0) {
      console.log('AudioPlayer: Nessun chunk da riprodurre');
      return false;
    }

    try {
      // Ordina i chunk per indice
      const indexedChunks = this.chunkBuffer
        .filter(chunk => typeof chunk.index === 'number')
        .sort((a, b) => (a.index as number) - (b.index as number));
      const nonIndexedChunks = this.chunkBuffer.filter(chunk => typeof chunk.index !== 'number');
      const allChunks = [...indexedChunks, ...nonIndexedChunks];

      if (allChunks.length === 0) {
        this.clearChunks();
        return false;
      }

      // Decodifica tutti i chunk in binario
      const binaryChunks: Uint8Array[] = [];
      for (const chunk of allChunks) {
        const binary = decodeBase64(chunk.data);
        if (binary.length > 0) {
          binaryChunks.push(binary);
        }
      }

      if (binaryChunks.length === 0) {
        this.clearChunks();
        return false;
      }

      // Concatena tutti i dati PCM16
      const totalLength = binaryChunks.reduce((acc, c) => acc + c.length, 0);
      const pcm16Data = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of binaryChunks) {
        pcm16Data.set(chunk, offset);
        offset += chunk.length;
      }

      console.log(`AudioPlayer: ${totalChunks} chunk -> ${pcm16Data.length} bytes PCM16`);

      // Wrappa in WAV per la riproduzione con expo-av
      const wavData = wrapPcm16InWav(pcm16Data, AUDIO_CONFIG.SAMPLE_RATE);
      const wavBase64 = encodeBase64(wavData);

      const tempPath = `${FileSystem.documentDirectory}voice_response_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(tempPath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync({ uri: tempPath });
      this.currentSound = sound;

      this.currentSound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('AudioPlayer: Riproduzione completata');
          await this.onPlaybackComplete(onComplete, tempPath);
        }
      });

      await this.currentSound.playAsync();
      this.isPlaying = true;
      this.clearChunks();

      console.log('AudioPlayer: Riproduzione WAV avviata');
      return true;

    } catch (error) {
      console.error('AudioPlayer: Errore riproduzione PCM16:', error);
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
  }

  private async onPlaybackComplete(onComplete?: () => void, audioFilePath?: string): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('Errore cleanup audio:', error);
      }
      this.currentSound = null;
    }

    if (audioFilePath) {
      try {
        await FileSystem.deleteAsync(audioFilePath);
      } catch {
        // Ignora errore eliminazione file temp
      }
    }

    this.isPlaying = false;
    onComplete?.();
  }

  async stopPlayback(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
      } catch (error) {
        console.error('Errore stop riproduzione:', error);
      }
      this.currentSound = null;
    }
    this.isPlaying = false;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getChunksCount(): number {
    return this.chunkBuffer.length;
  }

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
