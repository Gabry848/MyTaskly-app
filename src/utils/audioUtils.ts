import { requestRecordingPermissionsAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { VoiceProcessor } from '@picovoice/react-native-voice-processor';
import TrackPlayer, { State, Event, AndroidAudioContentType } from 'react-native-track-player';

/**
 * Utility per la gestione dell'audio nella chat vocale
 * Registrazione: @picovoice/react-native-voice-processor (streaming frames PCM16)
 * Riproduzione: react-native-track-player (streaming playback con queue)
 * Server richiede PCM16 a 24kHz, VoiceProcessor registra a 24kHz direttamente
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
// Numero di frame da scartare all'avvio del microfono.
// VoiceProcessor produce un transient (click/rumore) nei primi frame dopo start().
// A 24kHz con FRAME_LENGTH=1024, ogni frame dura ~43ms → 10 frame ≈ 430ms di warm-up.
// Questo evita che il VAD di OpenAI interpreti il rumore di avvio come voce.
const MIC_WARMUP_FRAMES = 10;

export class AudioRecorder {
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;
  private onChunkCallback: ((base64Chunk: string) => void) | null = null;
  private frameListener: ((frame: number[]) => void) | null = null;
  private errorListener: ((error: any) => void) | null = null;
  private voiceProcessor: VoiceProcessor = VoiceProcessor.instance;
  private warmupFramesRemaining: number = 0; // Frame da scartare dopo start()

  /**
   * Avvia la registrazione audio con streaming frames.
   * VoiceProcessor registra direttamente a 24kHz, ogni frame viene convertito in PCM16 base64.
   */
  async startRecording(
    onChunk?: (base64Chunk: string) => void
  ): Promise<boolean> {
    try {
      this.onChunkCallback = onChunk || null;
      this.warmupFramesRemaining = MIC_WARMUP_FRAMES; // Reset warm-up ad ogni avvio

      // Verifica permessi microfono
      if (!(await this.voiceProcessor.hasRecordAudioPermission())) {
        console.error('Permesso microfono non concesso');
        return false;
      }

      // Listener per i frames audio: number[] di campioni Int16 @ 24kHz
      this.frameListener = (frame: number[]) => {
        if (!this.isRecording) return;

        // Scarta i primi frame per eliminare il transient di avvio del microfono.
        // Questi frame contengono spesso click/rumore che triggerano il VAD del server.
        if (this.warmupFramesRemaining > 0) {
          this.warmupFramesRemaining--;
          if (this.warmupFramesRemaining === 0) {
            console.log('[AudioRecorder] Warm-up completato, invio audio al server');
          }
          return;
        }

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
 * Classe per gestire la riproduzione streaming di chunk audio PCM16 con react-native-track-player.
 * Ogni chunk viene scritto come file WAV temporaneo e aggiunto alla queue di TrackPlayer,
 * consentendo la riproduzione in streaming senza attendere tutti i chunk.
 */
export class AudioPlayer {
  private isPlaying: boolean = false;
  private isSetup: boolean = false;
  private isSettingUp: boolean = false;
  private setupPromise: Promise<void> | null = null;
  private tempFiles: string[] = [];
  private chunkCounter: number = 0;
  private pendingChunks: number = 0; // Incrementato SINCRONAMENTE prima dell'async
  private onCompleteCallback: (() => void) | null = null;
  private queueEndedListener: any = null;
  private trackChangedListener: any = null;
  private allChunksReceived: boolean = false;
  // sessionId: cambia ad ogni clearChunks/stopPlayback per invalidare addChunk in volo.
  // Evita che chunk di una sessione precedente decrementino pendingChunks di quella nuova
  // e corrompano lo stato (pendingChunks < 0).
  private sessionId: number = 0;
  // Polling fallback: se PlaybackQueueEnded non scatta, lo triggeriamo controllando
  // se la posizione di riproduzione non avanza (vero blocco) vs audio ancora in corso.
  private playbackWatchdog: NodeJS.Timeout | null = null;
  private static readonly WATCHDOG_INTERVAL_MS = 500;
  // Se la posizione TrackPlayer non cambia per N ms consecutivi → vero blocco
  private static readonly WATCHDOG_STALL_MS = 2000;
  private lastWatchdogPosition: number = -1;
  private lastWatchdogProgressAt: number = 0;

  /**
   * Inizializza TrackPlayer se non ancora configurato.
   * Usa un pattern singleton per evitare setup multipli concorrenti.
   */
  async setup(): Promise<void> {
    if (this.isSetup) return;

    // Se è già in corso un setup, attendi quello
    if (this.isSettingUp && this.setupPromise) {
      await this.setupPromise;
      return;
    }

    this.isSettingUp = true;
    this.setupPromise = this._doSetup();

    try {
      await this.setupPromise;
    } finally {
      this.isSettingUp = false;
      this.setupPromise = null;
    }
  }

  private async _doSetup(): Promise<void> {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
        androidAudioContentType: AndroidAudioContentType.Speech,
      });
      this.isSetup = true;
      console.log('TrackPlayer: Setup completato');
    } catch (error: any) {
      // Il player potrebbe essere già inizializzato da una sessione precedente
      if (error?.message?.includes('already been initialized')) {
        this.isSetup = true;
      } else {
        console.error('TrackPlayer: Errore setup:', error);
        throw error;
      }
    }
  }

  /**
   * Pre-inizializza TrackPlayer anticipatamente (da chiamare all'avvio sessione).
   * Evita il ritardo del primo addChunk().
   */
  async preSetup(): Promise<void> {
    try {
      await this.setup();
    } catch (error) {
      console.error('TrackPlayer: Errore pre-setup:', error);
    }
  }

  /**
   * Aggiunge un chunk PCM16 base64 direttamente alla queue di TrackPlayer.
   * Il chunk viene wrappato in WAV, scritto su file e aggiunto alla queue.
   * Se è il primo chunk, avvia la riproduzione immediatamente.
   */
  async addChunk(base64Data: string, chunkIndex?: number): Promise<boolean> {
    // Cattura il sessionId corrente SINCRONAMENTE prima di qualsiasi await.
    // Se nel frattempo stopPlayback/clearChunks viene chiamato (sessionId cambia),
    // questo chunk viene scartato senza decrementare i contatori della nuova sessione.
    const mySession = this.sessionId;

    // Incrementa il contatore SINCRONAMENTE prima di qualsiasi operazione async.
    this.pendingChunks++;

    try {
      await this.setup();

      // Sessione invalidata durante il setup: scarta silenziosamente
      if (this.sessionId !== mySession) {
        // Non decrementare: clearChunks/stopPlayback ha già azzerato pendingChunks
        return false;
      }

      const binary = decodeBase64(base64Data);
      if (binary.length === 0) {
        this.pendingChunks--;
        return false;
      }

      // Wrappa in WAV
      const wavData = wrapPcm16InWav(binary, AUDIO_CONFIG.SAMPLE_RATE);
      const wavBase64 = encodeBase64(wavData);

      // Scrivi file temporaneo
      const tempPath = `${FileSystem.cacheDirectory}voice_chunk_${Date.now()}_${this.chunkCounter}.wav`;
      await FileSystem.writeAsStringAsync(tempPath, wavBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Sessione invalidata durante la scrittura su file: scarta
      if (this.sessionId !== mySession) {
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {});
        return false;
      }

      this.tempFiles.push(tempPath);

      // Aggiungi alla queue di TrackPlayer
      await TrackPlayer.add({
        id: `voice_chunk_${this.chunkCounter}`,
        url: tempPath,
        title: 'Risposta vocale',
        artist: 'MyTaskly',
      });

      // Sessione invalidata durante TrackPlayer.add: scarta
      if (this.sessionId !== mySession) {
        return false;
      }

      this.chunkCounter++;
      this.pendingChunks--;

      // Avvia la riproduzione al primo chunk
      if (!this.isPlaying) {
        this.isPlaying = true;
        await TrackPlayer.play();
        console.log('TrackPlayer: Riproduzione streaming avviata');
      }

      // Se tutti i chunk sono stati segnalati (audio_end ricevuto) e non ci sono
      // altri chunk in attesa, ora possiamo configurare il listener di completamento.
      if (this.allChunksReceived && this.pendingChunks === 0 && !this.queueEndedListener) {
        console.log(`TrackPlayer: Ultimo chunk pending processato, configuro listener completamento (${this.chunkCounter} chunk totali)`);
        this.setupQueueEndedListener();
      }

      return true;
    } catch (error) {
      if (this.sessionId === mySession) {
        this.pendingChunks--;
        if (this.allChunksReceived && this.pendingChunks === 0 && !this.queueEndedListener) {
          this.setupQueueEndedListener();
        }
      }
      console.error('TrackPlayer: Errore aggiunta chunk:', error);
      return false;
    }
  }

  /**
   * Segnala che tutti i chunk sono stati ricevuti (audio_end).
   * Se ci sono chunk ancora in fase di processamento (pendingChunks > 0),
   * il listener di completamento verrà configurato da addChunk() quando
   * l'ultimo chunk pending viene processato.
   */
  async signalAllChunksReceived(onComplete?: () => void): Promise<void> {
    this.allChunksReceived = true;
    this.onCompleteCallback = onComplete || null;

    // Se ci sono chunk ancora in fase di processamento async (scrittura file WAV),
    // NON configurare il listener ora. addChunk() lo farà dopo aver processato
    // l'ultimo chunk pending.
    if (this.pendingChunks > 0) {
      console.log(`TrackPlayer: ${this.pendingChunks} chunk ancora in elaborazione, listener differito`);
      return;
    }

    // Nessun chunk pending. Se non sta nemmeno riproducendo (nessun chunk mai ricevuto),
    // completa subito.
    if (!this.isPlaying && this.chunkCounter === 0) {
      console.log('TrackPlayer: Nessun chunk ricevuto, completamento immediato');
      this.handlePlaybackComplete();
      return;
    }

    // Tutti i chunk sono stati aggiunti alla queue, configura il listener
    this.setupQueueEndedListener();
  }

  /**
   * Configura il listener per la fine della riproduzione della queue.
   * Controlla prima se la riproduzione è già terminata.
   * Include un watchdog polling che sblocca il sistema se PlaybackQueueEnded
   * non scatta entro WATCHDOG_MAX_SILENT_MS dall'ultimo chunk aggiunto.
   */
  private async setupQueueEndedListener(): Promise<void> {
    // Safety: rimuovi listener e watchdog precedenti se presenti
    if (this.queueEndedListener) {
      this.queueEndedListener.remove();
      this.queueEndedListener = null;
    }
    if (this.trackChangedListener) {
      this.trackChangedListener.remove();
      this.trackChangedListener = null;
    }
    this._clearWatchdog();

    // Se non sta riproducendo (tutti i chunk sono falliti?), completa subito
    if (!this.isPlaying) {
      this.handlePlaybackComplete();
      return;
    }

    // Controlla se la riproduzione è già terminata
    try {
      const state = await TrackPlayer.getPlaybackState();
      if (state.state === State.Ended || state.state === State.Stopped) {
        this.handlePlaybackComplete();
        return;
      }
    } catch (error) {
      console.error('TrackPlayer: Errore verifica stato:', error);
    }

    // Registra listener per la fine della queue
    this.queueEndedListener = TrackPlayer.addEventListener(
      Event.PlaybackQueueEnded,
      () => {
        console.log('TrackPlayer: Queue terminata');
        this._clearWatchdog();
        this.handlePlaybackComplete();
      }
    );

    // Resetta il timer dello stall ad ogni cambio track nella queue.
    // Quando TrackPlayer avanza da un chunk WAV al successivo la posizione si azzera
    // e il player entra brevemente in Buffering: senza questo listener il watchdog
    // scambia la transizione per uno stall reale e forza il completamento anticipato.
    this.trackChangedListener = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      () => {
        this.lastWatchdogPosition = -1;
        this.lastWatchdogProgressAt = Date.now();
      }
    );

    // Watchdog: se PlaybackQueueEnded non scatta, polling ogni WATCHDOG_INTERVAL_MS.
    // Su Android con file WAV multipli in sequenza rapida l'evento può mancare.
    this._startWatchdog();
  }

  private _startWatchdog(): void {
    // Inizializza il riferimento di posizione: qualsiasi avanzamento sarà registrato
    this.lastWatchdogPosition = -1;
    this.lastWatchdogProgressAt = Date.now();

    this.playbackWatchdog = setInterval(async () => {
      // Se la callback è già stata invocata (handlePlaybackComplete ha azzerato isPlaying),
      // il watchdog si auto-annulla.
      if (!this.isPlaying) {
        this._clearWatchdog();
        return;
      }
      try {
        const state = await TrackPlayer.getPlaybackState();
        if (state.state === State.Ended || state.state === State.Stopped || state.state === State.None) {
          console.log(`TrackPlayer: Watchdog rilevato fine riproduzione (state=${state.state})`);
          this._clearWatchdog();
          this.handlePlaybackComplete();
          return;
        }

        // Buffering = TrackPlayer sta caricando il chunk successivo della queue:
        // non è uno stall, resetta il timer di stall.
        if (state.state === State.Buffering) {
          this.lastWatchdogProgressAt = Date.now();
          return;
        }

        // Controlla se la posizione di riproduzione sta avanzando.
        // Se rimane identica per WATCHDOG_STALL_MS consecutivi → vero blocco.
        const progress = await TrackPlayer.getProgress();
        const currentPos = progress.position;

        if (currentPos > this.lastWatchdogPosition + 0.05) {
          // Posizione avanzata: aggiorna il riferimento
          this.lastWatchdogPosition = currentPos;
          this.lastWatchdogProgressAt = Date.now();
        } else if (currentPos < this.lastWatchdogPosition - 0.02) {
          // Posizione resettata (cambio track nella queue): non è uno stall,
          // è TrackPlayer che passa al chunk successivo. Reimposta il riferimento.
          this.lastWatchdogPosition = currentPos;
          this.lastWatchdogProgressAt = Date.now();
        } else {
          // Posizione ferma: controlla da quanto tempo
          const stalledMs = Date.now() - this.lastWatchdogProgressAt;
          if (stalledMs > AudioPlayer.WATCHDOG_STALL_MS) {
            console.warn(`TrackPlayer: Watchdog stall (${stalledMs}ms a pos=${currentPos.toFixed(2)}s), forzo completamento`);
            this._clearWatchdog();
            this.handlePlaybackComplete();
          }
        }
      } catch {
        // Ignora errori del watchdog
      }
    }, AudioPlayer.WATCHDOG_INTERVAL_MS);
  }

  private _clearWatchdog(): void {
    if (this.playbackWatchdog) {
      clearInterval(this.playbackWatchdog);
      this.playbackWatchdog = null;
    }
  }

  /**
   * Gestisce la fine della riproduzione: cleanup e callback.
   * Guard con isPlaying per prevenire doppie invocazioni (watchdog + evento).
   */
  private async handlePlaybackComplete(): Promise<void> {
    // Guard: evita doppie invocazioni (watchdog + PlaybackQueueEnded simultanei)
    if (!this.isPlaying) return;

    // Rimuovi listener e watchdog
    if (this.queueEndedListener) {
      this.queueEndedListener.remove();
      this.queueEndedListener = null;
    }
    if (this.trackChangedListener) {
      this.trackChangedListener.remove();
      this.trackChangedListener = null;
    }
    this._clearWatchdog();

    this.isPlaying = false;
    console.log('TrackPlayer: Riproduzione completata');

    // Reset TrackPlayer
    try {
      await TrackPlayer.reset();
    } catch (error) {
      console.error('TrackPlayer: Errore reset:', error);
    }

    // Pulisci file temporanei
    await this.cleanupTempFiles();

    // Invoca callback
    const callback = this.onCompleteCallback;
    this.onCompleteCallback = null;
    this.allChunksReceived = false;
    this.chunkCounter = 0;
    callback?.();
  }

  /**
   * Elimina i file WAV temporanei
   */
  private async cleanupTempFiles(): Promise<void> {
    for (const filePath of this.tempFiles) {
      try {
        await FileSystem.deleteAsync(filePath, { idempotent: true });
      } catch {
        // Ignora errori di eliminazione
      }
    }
    this.tempFiles = [];
  }

  /**
   * Svuota lo stato interno (senza fermare la riproduzione).
   * Incrementa sessionId per invalidare tutti gli addChunk in volo.
   */
  clearChunks(): void {
    this.sessionId++;
    this.allChunksReceived = false;
    this.chunkCounter = 0;
    this.pendingChunks = 0;
  }

  async stopPlayback(): Promise<void> {
    // Incrementa sessionId: tutti gli addChunk in volo per la sessione precedente
    // vedranno sessionId !== mySession e si scarteranno senza toccare i contatori.
    this.sessionId++;

    if (this.queueEndedListener) {
      this.queueEndedListener.remove();
      this.queueEndedListener = null;
    }
    if (this.trackChangedListener) {
      this.trackChangedListener.remove();
      this.trackChangedListener = null;
    }
    this._clearWatchdog();

    try {
      await TrackPlayer.reset();
    } catch (error) {
      console.error('TrackPlayer: Errore stop:', error);
    }

    this.isPlaying = false;
    this.onCompleteCallback = null;
    this.allChunksReceived = false;
    this.chunkCounter = 0;
    this.pendingChunks = 0;
    await this.cleanupTempFiles();
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getChunksCount(): number {
    return this.chunkCounter;
  }

  /**
   * Restituisce true se ci sono chunk in fase di processamento (non ancora aggiunti alla queue)
   * o già aggiunti alla queue. Utile per evitare premature auto-unmute.
   */
  hasPendingOrQueuedChunks(): boolean {
    return this.pendingChunks > 0 || this.chunkCounter > 0;
  }

  async destroy(): Promise<void> {
    await this.stopPlayback();
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
