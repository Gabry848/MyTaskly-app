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

/**
 * Classe per gestire la registrazione audio
 */
export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private isRecording: boolean = false;
  private recordingStartTime: number = 0;

  constructor() {}

  /**
   * Inizializza e avvia la registrazione audio
   */
  async startRecording(): Promise<boolean> {
    try {
      // Richiedi i permessi per il microfono
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        console.error('Permessi microfono non concessi');
        return false;
      }

      // Configura la modalità audio per la registrazione
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Crea una nuova registrazione
      this.recording = new Audio.Recording();
      
      // Configura le opzioni di registrazione usando solo il preset standard
      // Questo dovrebbe generare un M4A compatibile con Whisper
      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      // Prepara e avvia la registrazione
      await this.recording.prepareToRecordAsync(recordingOptions);
      await this.recording.startAsync();
      
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      console.log('🎤 Registrazione audio iniziata');
      return true;
      
    } catch (error) {
      console.error('Errore avvio registrazione:', error);
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
   * Pulisce le risorse della registrazione
   */
  private cleanup(): void {
    this.recording = null;
    this.isRecording = false;
    this.recordingStartTime = 0;
  }
}

/**
 * Classe per gestire la riproduzione audio
 */
export class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private audioQueue: string[] = [];
  private isPlaying: boolean = false;

  constructor() {}

  /**
   * Riproduce audio da dati base64
   */
  async playAudioFromBase64(base64Data: string, onComplete?: () => void): Promise<boolean> {
    try {
      // Configura la modalità audio per la riproduzione
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Crea un URI temporaneo per i dati base64
      // Il server probabilmente risponde con M4A, quindi usiamo quella estensione per la riproduzione
      const tempUri = `${FileSystem.documentDirectory}temp_audio_${Date.now()}.m4a`;
      
      // Scrivi i dati base64 in un file temporaneo
      await FileSystem.writeAsStringAsync(tempUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Carica e riproduci l'audio
      const { sound } = await Audio.Sound.createAsync({ uri: tempUri });
      this.sound = sound;
      
      // Configura callback per quando la riproduzione finisce
      this.sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('🔊 Riproduzione completata');
          this.onPlaybackComplete(onComplete);
        }
      });

      await this.sound.playAsync();
      this.isPlaying = true;
      
      console.log('🔊 Riproduzione audio iniziata');
      return true;
      
    } catch (error) {
      console.error('Errore riproduzione audio:', error);
      return false;
    }
  }

  /**
   * Aggiunge audio alla coda di riproduzione
   */
  queueAudio(base64Data: string): void {
    this.audioQueue.push(base64Data);
    
    // Se non stiamo riproducendo, inizia la riproduzione della coda
    if (!this.isPlaying) {
      this.playNextInQueue();
    }
  }

  /**
   * Riproduce il prossimo audio in coda
   */
  private async playNextInQueue(): Promise<void> {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    const nextAudio = this.audioQueue.shift()!;
    await this.playAudioFromBase64(nextAudio);
  }

  /**
   * Gestisce il completamento della riproduzione
   */
  private async onPlaybackComplete(onComplete?: () => void): Promise<void> {
    await this.cleanup();
    
    // Riproduce il prossimo audio in coda se presente
    if (this.audioQueue.length > 0) {
      setTimeout(() => {
        this.playNextInQueue();
      }, 100); // Piccola pausa tra i file audio
    } else {
      this.isPlaying = false;
      // Chiama il callback quando la riproduzione è davvero finita
      if (onComplete) {
        onComplete();
      }
    }
  }

  /**
   * Ferma la riproduzione corrente
   */
  async stopPlayback(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        console.log('🔊 Riproduzione fermata');
      } catch (error) {
        console.error('Errore stop riproduzione:', error);
      }
    }
    
    await this.cleanup();
    this.isPlaying = false;
  }

  /**
   * Svuota la coda audio
   */
  clearQueue(): void {
    this.audioQueue = [];
  }

  /**
   * Controlla se la riproduzione è attiva
   */
  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Pulisce le risorse audio
   */
  private async cleanup(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('Errore cleanup audio:', error);
      }
      this.sound = null;
    }
  }

  /**
   * Distrugge il player e pulisce tutte le risorse
   */
  async destroy(): Promise<void> {
    await this.stopPlayback();
    this.clearQueue();
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
