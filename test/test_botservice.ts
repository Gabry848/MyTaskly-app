import { sendMessageToBot, validateMessage, formatMessage } from "../src/services/botservice";

/**
 * Script di test TypeScript per sendMessageToBot
 * Esegue test rapidi della funzione di invio messaggi
 */

// Messaggi di test
const testMessages = [
  "Ciao, come stai?",
  "Aiutami a creare una lista delle cose da fare",
  "Che tempo fa oggi?",
  "Spiegami come funziona questa app",
  "Crea un promemoria per domani"
];

/**
 * Esegue un test singolo con un messaggio
 */
async function testSingleMessage(message: string, modelType: "base" | "advanced" = "base"): Promise<void> {
  console.log(`\n🧪 Test messaggio: "${message}"`);
  console.log(`🤖 Modello: ${modelType}`);
  console.log("─".repeat(50));
  
  try {
    // Valida il messaggio prima dell'invio
    if (!validateMessage(message)) {
      console.log("❌ Messaggio non valido");
      return;
    }
    
    // Formatta il messaggio
    const formattedMessage = formatMessage(message);
    console.log(`📝 Messaggio formattato: "${formattedMessage}"`);
    
    // Misura il tempo di risposta
    const startTime = Date.now();
    
    // Invia il messaggio al bot
    const response = await sendMessageToBot(formattedMessage, modelType);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`📥 Risposta ricevuta (${responseTime}ms):`);
    console.log(`"${response}"`);
    console.log("✅ Test completato con successo");
    
  } catch (error) {
    console.error("❌ Errore durante il test:", error);
  }
}

/**
 * Esegue test con contesto (messaggi precedenti)
 */
async function testWithContext(): Promise<void> {
  console.log("\n🧪 Test con contesto (messaggi precedenti)");
  console.log("=".repeat(50));
  
  const previousMessages = [
    { sender: "user", text: "Ciao" },
    { sender: "bot", text: "Ciao! Come posso aiutarti oggi?" },
    { sender: "user", text: "Sto pianificando la mia giornata" },
    { sender: "bot", text: "Perfetto! Posso aiutarti a organizzare le tue attività." }
  ];
  
  const newMessage = "Aiutami a creare una lista di 5 cose importanti da fare";
  
  try {
    console.log(`📚 Contesto: ${previousMessages.length} messaggi precedenti`);
    console.log(`📤 Nuovo messaggio: "${newMessage}"`);
    
    const startTime = Date.now();
    const response = await sendMessageToBot(newMessage, "advanced", previousMessages);
    const endTime = Date.now();
    
    console.log(`📥 Risposta con contesto (${endTime - startTime}ms):`);
    console.log(`"${response}"`);
    console.log("✅ Test con contesto completato");
    
  } catch (error) {
    console.error("❌ Errore nel test con contesto:", error);
  }
}

/**
 * Testa la performance con più messaggi consecutivi
 */
async function testPerformance(): Promise<void> {
  console.log("\n🧪 Test performance (più messaggi consecutivi)");
  console.log("=".repeat(50));
  
  const performanceData: { message: string; time: number; success: boolean }[] = [];
  
  for (let i = 0; i < testMessages.length; i++) {
    const message = testMessages[i];
    console.log(`\n📤 Test ${i + 1}/${testMessages.length}: "${message}"`);
    
    const startTime = Date.now();
    let success = false;
    
    try {
      await sendMessageToBot(message, "base");
      success = true;
      console.log("✅ Successo");
    } catch (error) {
      console.log("❌ Errore:", error);
    }
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    performanceData.push({
      message,
      time: responseTime,
      success
    });
    
    console.log(`⏱️  Tempo: ${responseTime}ms`);
    
    // Pausa tra i messaggi per non sovraccaricare il server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Statistiche finali
  console.log("\n📊 Statistiche performance:");
  console.log("─".repeat(30));
  
  const successfulTests = performanceData.filter(test => test.success);
  const averageTime = successfulTests.reduce((sum, test) => sum + test.time, 0) / successfulTests.length;
  const minTime = Math.min(...successfulTests.map(test => test.time));
  const maxTime = Math.max(...successfulTests.map(test => test.time));
  
  console.log(`✅ Test riusciti: ${successfulTests.length}/${performanceData.length}`);
  console.log(`⏱️  Tempo medio: ${Math.round(averageTime)}ms`);
  console.log(`🚀 Tempo minimo: ${minTime}ms`);
  console.log(`🐌 Tempo massimo: ${maxTime}ms`);
}

/**
 * Funzione principale che esegue tutti i test
 */
async function main(): Promise<void> {
  console.log("🚀 Avvio test per sendMessageToBot");
  console.log("=".repeat(50));
  
  try {
    // Test singoli messaggi
    await testSingleMessage("Ciao, come stai?", "base");
    await testSingleMessage("Spiegami come organizzare le mie attività", "advanced");
    
    // Test con contesto
    await testWithContext();
    
    // Test di performance (opzionale - commentalo se non vuoi sovraccaricare il server)
    // await testPerformance();
    
    console.log("\n🎉 Tutti i test completati!");
    
  } catch (error) {
    console.error("💥 Errore durante l'esecuzione dei test:", error);
  }
}

// Esegui i test se lo script viene chiamato direttamente
if (require.main === module) {
  main();
}

export {
  testSingleMessage,
  testWithContext,
  testPerformance,
  main
};
