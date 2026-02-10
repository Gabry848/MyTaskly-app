import { createAudioPlayer, setAudioModeAsync, requestRecordingPermissionsAsync } from 'expo-audio';
import type { AudioPlayer as ExpoAudioPlayer } from 'expo-audio/build/AudioModule.types';
import * as FileSystem from 'expo-file-system';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';

/**
 * Utility per la gestione dell'audio nella chat vocale
 * Registrazione: @picovoice/react-native-voice-processor (streaming frames PCM16)
 * Riproduzione: expo-av (playback WAV)
 * Server richiede PCM16 a 24kHz, VoiceProcessor registra a 16kHz -> resample necessario
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
  SAMPLE_RATE: 24000, // Sample rate registrazione e server (VoiceProcessor supporta 24kHz diretto)
  CHANNELS: 1,
  BIT_DEPTH: 16,
  FRAME_LENGTH: 1024, // Numero di campioni per frame (VoiceProcessor)
  MAX_RECORDING_TIME: 300000, // 5 minuti per sessioni conversazionali
};


/**
 * Converte un array di campioni Int16 (number[]) in Uint8Array little-endian PCM16.
 * VoiceProcessor fornisce frames come number[], il server richiede PCM16 bytes.
 */
function int16ArrayToBytes(samples: number[]): Uint8Array {
  const buffer = new Uint8Array(samples.length * 2);
  const view = new DataView(buffer.buffer);
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(i * 2, samples[i], true); // little-endian
  }
  return buffer;
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
 * Classe per gestire la registrazione audio con @picovoice/react-native-voice-processor.
 * Fornisce streaming di chunks PCM16 base64 a 24kHz direttamente.
 */
export class AudioRecorder {
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private onChunkCallback: ((base64Chunk: string) => void) | null = null;
  private frameListener: ((frame: number[]) => void) | null = null;
  private errorListener: ((error: any) => void) | null = null;
  private voiceProcessor: VoiceProcessor = VoiceProcessor.instance;

  /**
   * Avvia la registrazione audio con streaming frames.
   * VoiceProcessor registra direttamente a 24kHz, ogni frame viene convertito in PCM16 base64.
   */
  async startRecording(
    onChunk?: (base64Chunk: string) => void
  ): Promise<boolean> {
    try {
      this.onChunkCallback = onChunk || null;

      // Verifica permessi microfono
      if (!(await this.voiceProcessor.hasRecordAudioPermission())) {
        console.error('Permesso microfono non concesso');
        return false;
      }

      // Listener per i frames audio: number[] di campioni Int16 @ 24kHz
      this.frameListener = (frame: number[]) => {
        if (!this.isRecording) return;

        try {
          // Converti campioni Int16 in bytes PCM16 little-endian
          const pcm16Bytes = int16ArrayToBytes(frame);

          // Encode in base64 e invia
          const base64Chunk = encodeBase64(pcm16Bytes);
          this.onChunkCallback?.(base64Chunk);
        } catch (error) {
          console.error('Errore processamento frame audio:', error);
        }
      };

      // Listener per errori
      this.errorListener = (error: any) => {
        console.error('VoiceProcessor errore:', error);
      };

      this.voiceProcessor.addFrameListener(this.frameListener);
      this.voiceProcessor.addErrorListener(this.errorListener);

      // Avvia la registrazione a 24kHz
      await this.voiceProcessor.start(AUDIO_CONFIG.FRAME_LENGTH, AUDIO_CONFIG.SAMPLE_RATE);

      this.isRecording = true;
      this.recordingStartTime = Date.now();

      console.log('Registrazione VoiceProcessor avviata - streaming PCM16 a 24kHz');
      return true;

    } catch (error) {
      console.error('Errore avvio registrazione:', error);
      this.cleanup();
      return false;
    }
  }

  /**
   * Ferma la registrazione. I chunks sono gia' stati inviati in streaming.
   */
  async stopRecording(): Promise<string | null> {
    if (!this.isRecording) {
      console.warn('Nessuna registrazione attiva');
      return null;
    }

    try {
      await this.voiceProcessor.stop();
      this.isRecording = false;
      console.log('Registrazione completata');
      return null;
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
        await this.voiceProcessor.stop();
      } catch (error) {
        console.error('Errore cancellazione registrazione:', error);
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.frameListener) {
      this.voiceProcessor.removeFrameListener(this.frameListener);
      this.frameListener = null;
    }
    if (this.errorListener) {
      this.voiceProcessor.removeErrorListener(this.errorListener);
      this.errorListener = null;
    }

    this.isRecording = false;
    this.recordingStartTime = 0;
    this.onChunkCallback = null;
  }
}

/**
 * Classe per gestire la riproduzione di chunk audio PCM16
 * Usa expo-audio per il playback
 */
export class AudioPlayer {
  private currentPlayer: ExpoAudioPlayer | null = null;
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

      // Wrappa in WAV per la riproduzione con expo-audio
      const wavData = wrapPcm16InWav(pcm16Data, AUDIO_CONFIG.SAMPLE_RATE);
      const wavBase64 = encodeBase64(wavData);

      const tempPath = `${FileSystem.documentDirectory}voice_response_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(tempPath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldPlayInBackground: true,
        shouldRouteThroughEarpiece: false,
      });

      const player = createAudioPlayer({ uri: tempPath });
      this.currentPlayer = player;

      player.addListener('playbackStatusUpdate', async (status) => {
        if (status.didJustFinish) {
          console.log('AudioPlayer: Riproduzione completata');
          await this.onPlaybackComplete(onComplete, tempPath);
        }
      });

      player.play();
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
    if (this.currentPlayer) {
      try {
        this.currentPlayer.remove();
      } catch (error) {
        console.error('Errore cleanup audio:', error);
      }
      this.currentPlayer = null;
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
    if (this.currentPlayer) {
      try {
        this.currentPlayer.pause();
        this.currentPlayer.remove();
      } catch (error) {
        console.error('Errore stop riproduzione:', error);
      }
      this.currentPlayer = null;
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
    const { status } = await requestRecordingPermissionsAsync();
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
