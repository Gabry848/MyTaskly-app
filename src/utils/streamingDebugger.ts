/**
 * Utilità per il debug e monitoraggio del sistema di streaming audio
 * Aiuta a diagnosticare problemi comuni e fornisce statistiche
 */

import { audioStreamingService } from '../services/audioStreamingService';

interface StreamingStats {
  activeSessions: number;
  totalSessionsCreated: number;
  averageChunksPerSession: number;
  orphanedSessions: number;
  memoryUsage: string;
}

interface SessionDebugInfo {
  id: string;
  chunksReceived: number;
  chunksPlayed: number;
  isPlaying: boolean;
  isCompleted: boolean;
  age: number; // in milliseconds
  status: 'active' | 'stalled' | 'orphaned';
}

class StreamingDebugger {
  private sessionCreationCount = 0;
  private lastDebugTime = 0;

  /**
   * Ottieni statistiche generali del sistema streaming
   */
  getStreamingStats(): StreamingStats {
    const sessions = this.getAllSessionsDebugInfo();
    
    return {
      activeSessions: sessions.filter(s => s.status === 'active').length,
      totalSessionsCreated: this.sessionCreationCount,
      averageChunksPerSession: sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + s.chunksReceived, 0) / sessions.length 
        : 0,
      orphanedSessions: sessions.filter(s => s.status === 'orphaned').length,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Ottieni informazioni dettagliate su tutte le sessioni
   */
  getAllSessionsDebugInfo(): SessionDebugInfo[] {
    const now = Date.now();
    const sessions: SessionDebugInfo[] = [];
    
    // Access private sessions through public API
    try {
      // This is a workaround to access session info
      // In production, you might want to add a debug method to the service
      let sessionId = 0;
      while (sessionId < 100) { // Max 100 sessions to check
        const fakeSessionId = `stream_${sessionId}`;
        const info = audioStreamingService.getSessionInfo(fakeSessionId);
        if (info) {
          sessions.push({
            id: fakeSessionId,
            chunksReceived: info.chunksReceived,
            chunksPlayed: info.chunksPlayed,
            isPlaying: info.isPlaying,
            isCompleted: info.isCompleted,
            age: now - sessionId, // Approximation
            status: this.determineSessionStatus(info, now - sessionId)
          });
        }
        sessionId++;
      }
    } catch (error) {
      console.warn('Debug: Could not access session info');
    }
    
    return sessions;
  }

  /**
   * Determina lo status di una sessione
   */
  private determineSessionStatus(
    info: any,
    age: number
  ): 'active' | 'stalled' | 'orphaned' {
    if (age > 60000) return 'orphaned'; // Older than 1 minute
    if (info.chunksReceived > 0 && !info.isPlaying && !info.isCompleted) return 'stalled';
    return 'active';
  }

  /**
   * Stima l'uso della memoria (approssimativo)
   */
  private estimateMemoryUsage(): string {
    const sessions = this.getAllSessionsDebugInfo();
    const totalChunks = sessions.reduce((sum, s) => sum + s.chunksReceived, 0);
    
    // Assume average chunk size of 10KB
    const estimatedBytes = totalChunks * 10 * 1024;
    
    if (estimatedBytes > 1024 * 1024) {
      return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(estimatedBytes / 1024).toFixed(1)} KB`;
    }
  }

  /**
   * Forza pulizia delle sessioni problematiche
   */
  async forceCleanup(): Promise<number> {
    const sessionsBefore = this.getAllSessionsDebugInfo().length;
    await audioStreamingService.forceCleanup();
    const sessionsAfter = this.getAllSessionsDebugInfo().length;
    
    const cleaned = sessionsBefore - sessionsAfter;
    console.log(`🧹 Debug cleanup: removed ${cleaned} sessions`);
    
    return cleaned;
  }

  /**
   * Log periodico delle statistiche (per debugging)
   */
  logPeriodicStats(intervalMs: number = 30000): void {
    const now = Date.now();
    
    if (now - this.lastDebugTime < intervalMs) return;
    this.lastDebugTime = now;

    const stats = this.getStreamingStats();
    console.log('📊 Streaming Stats:', {
      active: stats.activeSessions,
      total: stats.totalSessionsCreated,
      orphaned: stats.orphanedSessions,
      memory: stats.memoryUsage
    });

    // Auto-cleanup if too many orphaned sessions
    if (stats.orphanedSessions > 5) {
      console.log('🧹 Auto-cleaning orphaned sessions...');
      this.forceCleanup();
    }
  }

  /**
   * Incrementa il contatore delle sessioni create
   */
  trackSessionCreation(): void {
    this.sessionCreationCount++;
  }

  /**
   * Reset delle statistiche
   */
  resetStats(): void {
    this.sessionCreationCount = 0;
    this.lastDebugTime = 0;
  }
}

// Singleton instance
export const streamingDebugger = new StreamingDebugger();

// Utility per enable/disable debug logging
export const StreamingDebugUtils = {
  /**
   * Enable debug mode con logging automatico
   */
  enableDebugMode(): void {
    console.log('🔍 Streaming debug mode enabled');
    
    // Log stats every 30 seconds
    setInterval(() => {
      streamingDebugger.logPeriodicStats();
    }, 30000);
  },

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    console.log('🔍 Streaming debug mode disabled');
    // Note: this doesn't clear existing intervals
  },

  /**
   * Quick health check
   */
  async quickHealthCheck(): Promise<boolean> {
    try {
      const stats = streamingDebugger.getStreamingStats();
      
      // Check for problems
      if (stats.orphanedSessions > 10) {
        console.warn(`⚠️ Health check: ${stats.orphanedSessions} orphaned sessions detected`);
        await streamingDebugger.forceCleanup();
        return false;
      }

      if (stats.activeSessions > 20) {
        console.warn(`⚠️ Health check: ${stats.activeSessions} active sessions (too many)`);
        return false;
      }

      console.log('✅ Streaming health check passed');
      return true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }
};

export default streamingDebugger;
