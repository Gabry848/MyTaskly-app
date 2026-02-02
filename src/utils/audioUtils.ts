import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import ExpoAudioStudio from 'expo-audio-studio';

/**
 * Utility per la gestione dell'audio nella chat vocale
 * Registrazione: expo-audio-studio (streaming chunks PCM16 base64)
 * Riproduzione: expo-av (playback WAV)
 * Server richiede PCM16 a 24kHz, expo-audio-studio registra a 16kHz -> resample necessario
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
  SAMPLE_RATE: 24000, // Target sample rate richiesto dal server
  SOURCE_SAMPLE_RATE: 16000, // Sample rate di expo-audio-studio (fisso)
  CHANNELS: 1,
  BIT_DEPTH: 16,
  MAX_RECORDING_TIME: 300000, // 5 minuti per sessioni conversazionali
};

// Configurazioni VAD (Voice Activity Detection) - expo-audio-studio ha VAD nativo
export const VAD_CONFIG = {
  VOICE_ACTIVITY_THRESHOLD: 0.5, // Sensibilita' VAD (0.0-1.0)
  SILENCE_DURATION_MS: 1200,
  MIN_RECORDING_DURATION_MS: 500,
};

// Configurazione per normalizzazione audio level
export const AUDIO_LEVEL_CONFIG = {
  MIN_DB: -80,
  MAX_DB: -10,
};

/**
 * Resample PCM16 da 16kHz a 24kHz con interpolazione lineare.
 * Input/output: Uint8Array di campioni Int16 little-endian.
 * Rapporto 16000:24000 = 2:3
 */
function resample16to24(pcm16Data: Uint8Array): Uint8Array {
  const srcSamples = pcm16Data.length / 2; // 2 bytes per sample (Int16)
  if (srcSamples === 0) return new Uint8Array(0);

  const srcView = new DataView(pcm16Data.buffer, pcm16Data.byteOffset, pcm16Data.byteLength);

  // Rapporto: per ogni sample di output, calcola la posizione nel sorgente
  const ratio = AUDIO_CONFIG.SOURCE_SAMPLE_RATE / AUDIO_CONFIG.SAMPLE_RATE; // 16000/24000 = 0.6667
  const dstSamples = Math.floor(srcSamples / ratio);
  const dstBuffer = new Uint8Array(dstSamples * 2);
  const dstView = new DataView(dstBuffer.buffer);

  for (let i = 0; i < dstSamples; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;

    // Leggi campione corrente
    const sample0 = srcView.getInt16(srcIndex * 2, true);

    if (srcIndex + 1 < srcSamples && frac > 0) {
      // Interpolazione lineare tra due campioni
      const sample1 = srcView.getInt16((srcIndex + 1) * 2, true);
      const interpolated = Math.round(sample0 + frac * (sample1 - sample0));
      // Clamp a Int16 range
      const clamped = Math.max(-32768, Math.min(32767, interpolated));
      dstView.setInt16(i * 2, clamped, true);
    } else {
      dstView.setInt16(i * 2, sample0, true);
    }
  }

  return dstBuffer;
}

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
 * Classe per gestire la registrazione audio con expo-audio-studio.
 * Fornisce streaming di chunks PCM16 base64 resampled a 24kHz.
 */
export class AudioRecorder {
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private onChunkCallback: ((base64Chunk: string) => void) | null = null;
  private chunkSubscription: { remove: () => void } | null = null;
  private vadSubscription: { remove: () => void } | null = null;
  private statusSubscription: { remove: () => void } | null = null;
  private vadEnabled: boolean = false;
  private vadCallbacks: VADCallbacks = {};
  private isSpeechDetected: boolean = false;
  private silenceStartTime: number | null = null;

  /**
   * Avvia la registrazione audio con streaming chunks.
   * Ogni chunk viene resampled da 16kHz a 24kHz e inviato come base64 via onChunk callback.
   */
  async startRecording(
    enableVAD: boolean = false,
    vadCallbacks?: VADCallbacks,
    onChunk?: (base64Chunk: string) => void
  ): Promise<boolean> {
    try {
      this.onChunkCallback = onChunk || null;
      this.vadEnabled = enableVAD;
      this.vadCallbacks = vadCallbacks || {};
      this.isSpeechDetected = false;
      this.silenceStartTime = null;

      // Abilita streaming di chunks base64
      ExpoAudioStudio.setListenToChunks(true);

      // Sottoscrivi ai chunks audio: PCM16@16kHz in base64
      this.chunkSubscription = ExpoAudioStudio.addListener('onAudioChunk', (event: { base64: string }) => {
        if (!this.isRecording || !this.onChunkCallback) return;

        try {
          // Decodifica base64 -> PCM16 raw bytes @16kHz
          const pcm16at16k = decodeBase64(event.base64);

          // Resample 16kHz -> 24kHz
          const pcm16at24k = resample16to24(pcm16at16k);

          // Encode back to base64 e invia
          const resampled64 = encodeBase64(pcm16at24k);
          this.onChunkCallback(resampled64);
        } catch (error) {
          console.error('Errore processamento chunk audio:', error);
        }
      });

      // Sottoscrivi allo stato del recorder per metering
      this.statusSubscription = ExpoAudioStudio.addListener('onRecorderAmplitude', (event: { amplitude: number }) => {
        if (this.vadCallbacks.onMeteringUpdate) {
          // amplitude e' in dB
          this.vadCallbacks.onMeteringUpdate(event.amplitude);
        }
      });

      // Configura e abilita VAD nativo se richiesto
      if (enableVAD) {
        ExpoAudioStudio.setVADEnabled(true);
        ExpoAudioStudio.setVoiceActivityThreshold(VAD_CONFIG.VOICE_ACTIVITY_THRESHOLD);
        ExpoAudioStudio.setVADEventMode('onChange');

        this.vadSubscription = ExpoAudioStudio.addListener('onVoiceActivityDetected', (event: {
          isVoiceDetected: boolean;
          confidence: number;
          isStateChange: boolean;
          eventType: string;
        }) => {
          if (!this.isRecording) return;

          const recordingDuration = this.getRecordingDuration();
          if (recordingDuration < VAD_CONFIG.MIN_RECORDING_DURATION_MS) return;

          if (event.eventType === 'speech_start') {
            this.isSpeechDetected = true;
            this.silenceStartTime = null;
            this.vadCallbacks.onSpeechStart?.();
          } else if (event.eventType === 'silence_start') {
            this.vadCallbacks.onSilenceDetected?.();
            this.silenceStartTime = Date.now();
          } else if (event.eventType === 'silence_continue' && this.isSpeechDetected && this.silenceStartTime) {
            const silenceDuration = Date.now() - this.silenceStartTime;
            if (silenceDuration >= VAD_CONFIG.SILENCE_DURATION_MS) {
              this.vadCallbacks.onAutoStop?.();
              this.vadCallbacks.onSpeechEnd?.();
            }
          }
        });
      }

      // Avvia la registrazione
      await ExpoAudioStudio.startRecording();

      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('Registrazione expo-audio-studio avviata', enableVAD ? '(VAD attivo)' : '', '- streaming chunks a 24kHz');
      return true;

    } catch (error) {
      console.error('Errore avvio registrazione:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Ferma la registrazione. I chunks sono gia' stati inviati in streaming.
   * Restituisce null (non serve piu' il blob completo).
   */
  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      console.warn('Nessuna registrazione attiva');
      return null;
    }

    try {
      await ExpoAudioStudio.stopRecording();
      this.isRecording = false;
      console.log('Registrazione completata');
      return null; // I chunks sono gia' stati inviati in streaming
    } catch (error) {
      console.error('Errore stop registrazione:', error);
      return null;
    } finally {
      this.cleanup();
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
    if (this.isRecording) {
      try {
        await ExpoAudioStudio.stopRecording();
      } catch (error) {
        console.error('Errore cancellazione registrazione:', error);
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.chunkSubscription) {
      this.chunkSubscription.remove();
      this.chunkSubscription = null;
    }
    if (this.vadSubscription) {
      this.vadSubscription.remove();
      this.vadSubscription = null;
    }
    if (this.statusSubscription) {
      this.statusSubscription.remove();
      this.statusSubscription = null;
    }

    ExpoAudioStudio.setListenToChunks(false);
    if (this.vadEnabled) {
      ExpoAudioStudio.setVADEnabled(false);
    }

    this.isRecording = false;
    this.recordingStartTime = 0;
    this.onChunkCallback = null;
    this.silenceStartTime = null;
    this.vadEnabled = false;
    this.isSpeechDetected = false;
  }
}

/**
 * Classe per gestire la riproduzione di chunk audio PCM16
 * Usa expo-av per il playback
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
  return bytes.buffer as ArrayBuffer;
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
