import { DEFAULT_BASE_URL } from '../constants/authConstants';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
}

type NetworkChangeCallback = (state: NetworkState) => void;

class NetworkService {
  private static instance: NetworkService;
  private listeners: NetworkChangeCallback[] = [];
  private currentState: NetworkState = {
    isConnected: true,
    isInternetReachable: true
  };
  private testInterval: NodeJS.Timeout | null = null;
  private consecutiveFailures = 0;

  static getInstance(): NetworkService {
    if (!NetworkService.instance) {
      NetworkService.instance = new NetworkService();
    }
    return NetworkService.instance;
  }

  constructor() {
    this.startNetworkMonitoring();
  }

  private async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${DEFAULT_BASE_URL}/support/health`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  async getNetworkState(): Promise<NetworkState> {
    const isHealthy = await this.checkBackendHealth();

    if (isHealthy) {
      this.consecutiveFailures = 0;
      this.updateNetworkState({ isConnected: true, isInternetReachable: true });
    } else {
      this.consecutiveFailures++;
      // Require 2 consecutive failures before declaring offline
      if (this.consecutiveFailures >= 2) {
        this.updateNetworkState({ isConnected: false, isInternetReachable: false });
      }
    }

    return this.currentState;
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

  async isOnline(): Promise<boolean> {
    return this.checkBackendHealth();
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

  async testConnectivity(url?: string): Promise<boolean> {
    if (url) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-cache',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response.ok;
      } catch {
        return false;
      }
    }
    return this.checkBackendHealth();
  }

  // Ottieni stato corrente (sincrono)
  getCurrentState(): NetworkState {
    return this.currentState;
  }
}

export default NetworkService;
export type { NetworkState, NetworkChangeCallback };