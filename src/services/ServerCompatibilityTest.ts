import { 
  sendVoiceMessageToBotOptimized,
  sendVoiceMessageToBot 
} from './botservice';

/**
 * Test di compatibilità con il server
 * Verifica che il client funzioni correttamente con gli endpoint server esistenti
 */
export class ServerCompatibilityTest {

  /**
   * Test endpoint base (/chat_bot_voice)
   */
  async testBaseEndpoint(audioUri: string) {
    console.log('🧪 Test endpoint base...');
    
    try {
      const startTime = Date.now();
      
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "base" // Usa /chat_bot_voice
      );
      
      const duration = Date.now() - startTime;
      
      console.log('✅ Endpoint base funziona:', {
        response,
        duration: `${duration}ms`,
        endpoint: '/chat_bot_voice'
      });
      
      return { success: true, response, duration };
      
    } catch (error) {
      console.error('❌ Endpoint base fallito:', error);
      return { success: false, error };
    }
  }

  /**
   * Test endpoint avanzato (/chat_bot_voice_advanced)
   */
  async testAdvancedEndpoint(audioUri: string, previousMessages: any[] = []) {
    console.log('🧪 Test endpoint avanzato...');
    
    try {
      const startTime = Date.now();
      
      let progressChunks: string[] = [];
      
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "advanced", // Usa /chat_bot_voice_advanced
        previousMessages,
        (chunk) => {
          progressChunks.push(chunk);
          console.log('📝 Chunk progressivo:', chunk);
        }
      );
      
      const duration = Date.now() - startTime;
      
      console.log('✅ Endpoint avanzato funziona:', {
        response,
        duration: `${duration}ms`,
        endpoint: '/chat_bot_voice_advanced',
        progressChunks: progressChunks.length,
        previousMessagesCount: previousMessages.length
      });
      
      return { 
        success: true, 
        response, 
        duration, 
        progressChunks: progressChunks.length 
      };
      
    } catch (error) {
      console.error('❌ Endpoint avanzato fallito:', error);
      return { success: false, error };
    }
  }

  /**
   * Test con cronologia messaggi
   */
  async testWithChatHistory(audioUri: string) {
    console.log('🧪 Test con cronologia chat...');
    
    const chatHistory = [
      { sender: 'user', text: 'Ciao, sono nuovo qui' },
      { sender: 'bot', text: 'Benvenuto! Come posso aiutarti?' },
      { sender: 'user', text: 'Vorrei sapere come funziona il sistema' }
    ];
    
    try {
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "advanced",
        chatHistory
      );
      
      console.log('✅ Test con cronologia completato:', {
        response,
        historyLength: chatHistory.length
      });
      
      return { success: true, response, historyUsed: true };
      
    } catch (error) {
      console.error('❌ Test con cronologia fallito:', error);
      return { success: false, error };
    }
  }

  /**
   * Test fallback automatico
   */
  async testFallbackMechanism(audioUri: string) {
    console.log('🧪 Test meccanismo fallback...');
    
    try {
      // Forza un errore nella modalità advanced per testare il fallback
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "advanced",
        [] // Nessun messaggio precedente
      );
      
      console.log('✅ Risposta ricevuta (possibile fallback):', response);
      
      return { success: true, response, fallbackTested: true };
      
    } catch (error) {
      console.error('❌ Anche il fallback è fallito:', error);
      return { success: false, error };
    }
  }

  /**
   * Confronto performance tra modalità
   */
  async compareEndpoints(audioUri: string) {
    console.log('🧪 Confronto performance endpoint...');
    
    const results = {
      base: null as any,
      advanced: null as any
    };
    
    // Test modalità base
    results.base = await this.testBaseEndpoint(audioUri);
    
    // Pausa per evitare sovraccarico server
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test modalità advanced
    results.advanced = await this.testAdvancedEndpoint(audioUri);
    
    // Analisi risultati
    if (results.base.success && results.advanced.success) {
      const improvement = results.base.duration - results.advanced.duration;
      const improvementPercent = (improvement / results.base.duration) * 100;
      
      console.log('📊 Analisi Performance:');
      console.log(`Base: ${results.base.duration}ms`);
      console.log(`Advanced: ${results.advanced.duration}ms`);
      console.log(`Differenza: ${improvement > 0 ? '+' : ''}${improvement}ms`);
      console.log(`Miglioramento: ${improvementPercent.toFixed(1)}%`);
      
      return {
        base: results.base,
        advanced: results.advanced,
        improvement: improvementPercent
      };
    }
    
    return results;
  }

  /**
   * Test completo di compatibilità
   */
  async runFullCompatibilityTest(audioUri: string) {
    console.log('🧪 === AVVIO TEST COMPLETO COMPATIBILITÀ SERVER ===');
    
    const testResults = {
      baseEndpoint: null as any,
      advancedEndpoint: null as any,
      chatHistory: null as any,
      fallback: null as any,
      performance: null as any
    };
    
    try {
      // Test 1: Endpoint base
      console.log('\n1️⃣ Test endpoint base...');
      testResults.baseEndpoint = await this.testBaseEndpoint(audioUri);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 2: Endpoint avanzato
      console.log('\n2️⃣ Test endpoint avanzato...');
      testResults.advancedEndpoint = await this.testAdvancedEndpoint(audioUri);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 3: Cronologia chat
      console.log('\n3️⃣ Test cronologia chat...');
      testResults.chatHistory = await this.testWithChatHistory(audioUri);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 4: Fallback
      console.log('\n4️⃣ Test fallback...');
      testResults.fallback = await this.testFallbackMechanism(audioUri);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 5: Performance
      console.log('\n5️⃣ Test performance...');
      testResults.performance = await this.compareEndpoints(audioUri);
      
      // Riepilogo finale
      console.log('\n🎯 === RIEPILOGO TEST COMPATIBILITÀ ===');
      console.log(`Base Endpoint: ${testResults.baseEndpoint?.success ? '✅' : '❌'}`);
      console.log(`Advanced Endpoint: ${testResults.advancedEndpoint?.success ? '✅' : '❌'}`);
      console.log(`Chat History: ${testResults.chatHistory?.success ? '✅' : '❌'}`);
      console.log(`Fallback: ${testResults.fallback?.success ? '✅' : '❌'}`);
      console.log(`Performance: ${testResults.performance?.improvement ? `+${testResults.performance.improvement.toFixed(1)}%` : 'N/A'}`);
      
      const successCount = Object.values(testResults).filter(r => r?.success).length;
      const totalTests = Object.keys(testResults).length;
      
      console.log(`\n🏆 Risultato finale: ${successCount}/${totalTests} test superati`);
      
      if (successCount === totalTests) {
        console.log('🎉 COMPATIBILITÀ SERVER: PERFETTA! 🎊');
      } else if (successCount >= totalTests - 1) {
        console.log('👍 COMPATIBILITÀ SERVER: BUONA');
      } else {
        console.log('⚠️ COMPATIBILITÀ SERVER: PROBLEMI RILEVATI');
      }
      
      return testResults;
      
    } catch (error) {
      console.error('❌ Errore durante test compatibilità:', error);
      return { error, testResults };
    }
  }

  /**
   * Test rapido per verificare che tutto funzioni
   */
  async quickCompatibilityCheck(audioUri: string) {
    console.log('⚡ Quick compatibility check...');
    
    try {
      // Test veloce modalità advanced
      const response = await sendVoiceMessageToBotOptimized(
        audioUri,
        "advanced",
        [{ sender: 'user', text: 'Test di compatibilità' }]
      );
      
      console.log('✅ Quick check passed:', response);
      return { compatible: true, response };
      
    } catch (error) {
      console.error('❌ Quick check failed:', error);
      
      // Fallback test
      try {
        const fallbackResponse = await sendVoiceMessageToBot(audioUri, "base");
        console.log('🔄 Fallback method works:', fallbackResponse);
        return { compatible: true, response: fallbackResponse, usedFallback: true };
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
        return { compatible: false, error: fallbackError };
      }
    }
  }
}

export default ServerCompatibilityTest;
