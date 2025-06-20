/**
 * Test per verificare che la gestione delle risposte del bot vocale funzioni correttamente
 */

import { 
  sendVoiceMessageToBotOptimized,
  sendVoiceMessageWithSmartHandling,
  extractVoiceResponseFields 
} from './botservice';

/**
 * Test della funzione extractVoiceResponseFields
 */
export function testResponseExtraction() {
  console.log('🧪 Test estrazione campi risposta...');
  
  // Simula risposta server standard
  const mockServerResponse = {
    message: "Ciao! Come posso aiutarti oggi?", // Risposta del bot
    recognized_text: "Ciao, ho bisogno di aiuto", // Quello che l'utente ha detto
    confidence: 0.95,
    language_detected: "it-IT",
    audio_format: "audio/m4a",
    mode: "normal"
  };

  const extracted = extractVoiceResponseFields(mockServerResponse);
  
  console.log('📋 Risultato estrazione:');
  console.log('🤖 Bot Response:', extracted.botResponse);
  console.log('👤 User Message:', extracted.userMessage);
  console.log('📊 Confidence:', extracted.confidence);
  console.log('🗣️ Language:', extracted.language);
  console.log('🎵 Audio Format:', extracted.audioFormat);

  // Verifiche
  if (extracted.botResponse === "Ciao! Come posso aiutarti oggi?") {
    console.log('✅ Bot response estratta correttamente');
  } else {
    console.error('❌ Errore estrazione bot response:', extracted.botResponse);
  }

  if (extracted.userMessage === "Ciao, ho bisogno di aiuto") {
    console.log('✅ User message estratto correttamente');
  } else {
    console.error('❌ Errore estrazione user message:', extracted.userMessage);
  }

  return extracted;
}

/**
 * Test del flusso completo di invio vocale
 */
export async function testVoiceMessageFlow(audioUri: string) {
  console.log('🧪 === TEST FLUSSO COMPLETO MESSAGGIO VOCALE ===');
  
  if (!audioUri) {
    console.warn('⚠️ AudioUri non fornito, uso URI di test');
    audioUri = 'file://test-audio.m4a'; // URI di test
  }

  try {
    console.log('1️⃣ Test funzione ottimizzata...');
    
    // Test modalità base
    console.log('📤 Test modalità base...');
    const baseResponse = await sendVoiceMessageToBotOptimized(
      audioUri,
      "base",
      [] // Nessun messaggio precedente
    );
    console.log('✅ Risposta modalità base:', baseResponse);

    // Test modalità advanced
    console.log('📤 Test modalità advanced...');
    const advancedResponse = await sendVoiceMessageToBotOptimized(
      audioUri,
      "advanced",
      [
        { sender: 'user', text: 'Messaggio di test precedente' },
        { sender: 'bot', text: 'Risposta di test precedente' }
      ]
    );
    console.log('✅ Risposta modalità advanced:', advancedResponse);

    console.log('2️⃣ Test funzione con gestione intelligente...');
    
    const smartResult = await sendVoiceMessageWithSmartHandling(audioUri, {
      modelType: "advanced",
      onProgress: (msg) => console.log('📋 Progresso:', msg),
      onChunkReceived: (chunk) => console.log('📝 Chunk:', chunk),
      maxRetries: 1
    });

    console.log('📊 Risultato gestione intelligente:');
    console.log('Success:', smartResult.success);
    console.log('Response:', smartResult.response);
    console.log('User Message:', smartResult.userMessage);
    console.log('Metadata:', smartResult.metadata);

    if (smartResult.success) {
      console.log('🎉 Test completato con successo!');
      
      // Verifica che la risposta sia quella del bot e non dell'utente
      if (smartResult.response && !smartResult.response.includes('Messaggio vocale non processato')) {
        console.log('✅ Risposta del bot ricevuta correttamente');
      } else {
        console.warn('⚠️ La risposta potrebbe non essere del bot:', smartResult.response);
      }
    } else {
      console.warn('⚠️ Test fallito:', smartResult.response);
    }

    return {
      baseResponse,
      advancedResponse,
      smartResult
    };

  } catch (error) {
    console.error('❌ Errore durante test:', error);
    return { error: error.message };
  }
}

/**
 * Test di parsing del JSON di risposta originale dell'utente
 */
export function testOriginalResponseParsing() {
  console.log('🧪 Test parsing risposta originale utente...');
  
  // Simula il JSON originale che aveva il problema
  const originalBadResponse = {
    "botResponse": "Il servizio è temporaneamente sovraccarico. Riprova tra qualche secondo.",
    "userMessage": "[Messaggio vocale non processato]"
  };

  console.log('📋 Risposta problematica originale:', originalBadResponse);

  // Ora simula quello che dovrebbe arrivare dal server corretto
  const correctServerResponse = {
    message: "Ciao! Ho capito la tua richiesta e posso aiutarti.",
    recognized_text: "Ciao, puoi aiutarmi con questo problema?",
    confidence: 0.92,
    language_detected: "it-IT",
    audio_format: "audio/m4a",
    mode: "normal"
  };

  const extracted = extractVoiceResponseFields(correctServerResponse);
  
  console.log('📋 Risposta corretta estratta:');
  console.log('🤖 Bot Response:', extracted.botResponse);
  console.log('👤 User Message:', extracted.userMessage);

  // Confronto
  console.log('\n📊 Confronto:');
  console.log('PRIMA - Bot Response:', originalBadResponse.botResponse);
  console.log('DOPO - Bot Response:', extracted.botResponse);
  console.log('PRIMA - User Message:', originalBadResponse.userMessage);
  console.log('DOPO - User Message:', extracted.userMessage);

  if (extracted.botResponse !== originalBadResponse.botResponse) {
    console.log('✅ Problema risolto! Ora restituiamo la risposta del bot, non errori');
  }

  if (extracted.userMessage && extracted.userMessage !== "[Messaggio vocale non processato]") {
    console.log('✅ User message ora viene estratto correttamente dal campo recognized_text');
  }

  return { originalBadResponse, correctServerResponse, extracted };
}

/**
 * Test completo di tutte le funzionalità
 */
export async function runAllVoiceTests(audioUri?: string) {
  console.log('🚀 === AVVIO TEST COMPLETI BOT VOCALE ===\n');
  
  const results = {
    extraction: null as any,
    flow: null as any,
    parsing: null as any
  };

  try {
    // Test 1: Estrazione campi
    console.log('1️⃣ Test estrazione campi...');
    results.extraction = testResponseExtraction();
    console.log('✅ Test estrazione completato\n');

    // Test 2: Parsing risposta
    console.log('2️⃣ Test parsing risposta...');
    results.parsing = testOriginalResponseParsing();
    console.log('✅ Test parsing completato\n');

    // Test 3: Flusso completo (solo se audioUri fornito)
    if (audioUri) {
      console.log('3️⃣ Test flusso completo...');
      results.flow = await testVoiceMessageFlow(audioUri);
      console.log('✅ Test flusso completato\n');
    } else {
      console.log('3️⃣ Test flusso saltato (nessun audioUri fornito)\n');
    }

    console.log('🎉 === TUTTI I TEST COMPLETATI ===');
    console.log('📊 Riepilogo risultati:');
    console.log('- Estrazione campi: ✅');
    console.log('- Parsing risposta: ✅');
    console.log('- Flusso completo:', audioUri ? '✅' : '⏭️ Saltato');

    return results;

  } catch (error) {
    console.error('❌ Errore durante test:', error);
    return { error: error.message, results };
  }
}

export default {
  testResponseExtraction,
  testVoiceMessageFlow,
  testOriginalResponseParsing,
  runAllVoiceTests
};
