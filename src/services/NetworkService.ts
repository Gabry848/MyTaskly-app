// Servizio di rete semplice senza dipendenze esterne
// Fallback per quando NetInfo non è disponibile

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
}

type NetworkChangeCallback = (state: NetworkState) => void;

class NetworkService {
  private static instance: NetworkService;
  private listeners: NetworkChangeCallback[] = [];
  private currentState: NetworkState = {
    isConnected: true, // Assume connesso di default
    isInternetReachable: true
  };
  private testInterval: NodeJS.Timeout | null = null;

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.startNetworkMonitoring();
  }

  // Ottieni stato attuale della rete
  async getNetworkState(): Promise<NetworkState> {
    // Prova a testare la connessione con una richiesta rapida
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const isConnected = response.status === 204;
      this.updateNetworkState({
        isConnected,
        isInternetReachable: isConnected
      });
      
      return this.currentState;
    } catch (error) {
      // Fallback: assume offline
      this.updateNetworkState({
        isConnected: false,
        isInternetReachable: false
      });
      
      return this.currentState;
    }
  }

  // Aggiungi listener per cambiamenti di stato rete
  addNetworkListener(callback: NetworkChangeCallback): () => void {
    this.listeners.push(callback);
    
    // Restituisci funzione per rimuovere il listener
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Test rapido di connettività (per uso interno)
  async isOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 sec timeout

      await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      return false;
    }
  }

  private updateNetworkState(newState: NetworkState): void {
    const stateChanged = 
      this.currentState.isConnected !== newState.isConnected ||
      this.currentState.isInternetReachable !== newState.isInternetReachable;

    this.currentState = newState;

    if (stateChanged) {
      console.log('[NETWORK] Stato rete cambiato:', newState);
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.currentState);
      } catch (error) {
        console.error('[NETWORK] Errore nel callback listener:', error);
      }
    });
  }

  private startNetworkMonitoring(): void {
    // Test iniziale
    this.getNetworkState().catch(error => 
      console.error('[NETWORK] Errore test iniziale:', error)
    );

    // Monitora ogni 30 secondi quando attivo
    this.testInterval = setInterval(async () => {
      try {
        await this.getNetworkState();
      } catch (error) {
        console.error('[NETWORK] Errore monitoring periodico:', error);
      }
    }, 30000); // 30 secondi
  }

  // Pulizia risorse
  cleanup(): void {
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }
    this.listeners = [];
  }

  // Test di connettività con endpoint personalizzato
  async testConnectivity(url: string = 'https://www.google.com/generate_204'): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout

      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Ottieni stato corrente (sincrono)
  getCurrentState(): NetworkState {
    return this.currentState;
  }
}

export default NetworkService;
export type { NetworkState, NetworkChangeCallback };