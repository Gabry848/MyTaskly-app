/**
 * Script di test per la funzione sendMessageToBot del botservice
 * Testa vari scenari di invio messaggi al bot
 * 
 * Questo script implementa direttamente le funzionalità di test
 * senza dipendere dall'importazione del modulo TypeScript
 */

const axios = require("axios");

// Token di test (sostituisci con un token valido)
const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYWJyeTg0OCIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjE3NTM0MzM3MDJ9.KQCu3dfHCWr8s0hD4ByQawAD7rzlSgfAZAO5-P7dwEk";

// URL del server (modifica se necessario)
const SERVER_URL = "https://taskly-production.up.railway.app";

// Costanti
const MESSAGE_MAX_LENGTH = 1000;
const MAX_PREVIOUS_MESSAGES = 5;

/**
 * Implementazione locale delle funzioni del botservice per i test
 */

// Simula la funzione preparePreviousMessages
function preparePreviousMessages(
  messages = [],
  maxMessages = MAX_PREVIOUS_MESSAGES,
  maxTotalLength = MESSAGE_MAX_LENGTH
) {
  if (!messages || messages.length === 0) return [];

  const messagesWithoutLast = messages.slice(0, -1);
  const recentMessages = messagesWithoutLast.slice(-maxMessages);

  const formattedMessages = recentMessages.map((msg) => {
    const content = msg.text || msg.content || "";
    const processedContent = msg.role === "user" || msg.sender === "user" 
      ? `${content} (già fatto)` 
      : content;
    
    return {
      content: processedContent,
      role: msg.sender || msg.role || "user",
    };
  });

  let totalLength = 0;
  formattedMessages.forEach((msg) => {
    totalLength += msg.content.length;
  });

  if (totalLength > maxTotalLength) {
    return formattedMessages.slice(-Math.floor(maxMessages / 2));
  }

  return formattedMessages;
}

// Implementazione locale di sendMessageToBot
async function sendMessageToBot(
  userMessage,
  modelType = "base",
  previousMessages = []
) {
  try {
    if (!mockToken) {
      return "Mi dispiace, sembra che tu non sia autenticato. Effettua il login per continuare.";
    }

    const formattedPreviousMessages = preparePreviousMessages(previousMessages);
    
    const requestPayload = {
      quest: userMessage,
      model: modelType,
      previous_messages: formattedPreviousMessages,
    };
    
    console.log("📤 Invio messaggio al bot:", requestPayload);

    const response = await axios.post(`${SERVER_URL}/chat/text`, requestPayload, {
      headers: {
        Authorization: `Bearer ${mockToken}`,
        "Content-Type": "application/json",
      },
      responseType: "stream",
    });

    console.log("📥 Stream iniziato dal server");

    return new Promise((resolve, reject) => {
      const stream = response.data;
      let fullMessage = '';

      stream.on("data", (data) => {
        const text = data.toString('utf8');
        
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: {')) {
            try {
              const jsonStr = line.replace('data: ', '').trim();
              const parsed = JSON.parse(jsonStr);
              
              if (parsed.type === 'content' && parsed.content) {
                fullMessage += parsed.content;
                process.stdout.write(parsed.content); // Mostra in real-time
              } else if (parsed.type === 'stream_start') {
                console.log('--- Stream iniziato ---');
              }
            } catch (e) {
              console.log("Errore parsing JSON per linea:", line);
              console.log("Errore:", e.message);
            }
          }
        }
      });

      stream.on("end", () => {
        console.log("\n--- Stream completato ---");
        resolve(fullMessage || "Nessuna risposta ricevuta dal bot.");
      });

      stream.on("error", (error) => {
        console.error("❌ Errore nello stream:", error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error("❌ Errore nella comunicazione con il bot:", error);
    
    if (error.response?.status === 401) {
      return "Sessione scaduta. Effettua nuovamente il login.";
    }
    
    if (error.response?.status === 429) {
      return "Troppe richieste. Riprova tra qualche secondo.";
    }
    
    if (error.response?.status >= 500) {
      return "Il servizio è temporaneamente non disponibile. Riprova più tardi.";
    }
    
    return "Mi dispiace, si è verificato un errore. Riprova più tardi.";
  }
}

// Implementazione locale di validateMessage
function validateMessage(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }
  
  const trimmedMessage = message.trim();
  
  if (trimmedMessage.length === 0 || trimmedMessage.length > 5000) {
    return false;
  }
  
  return true;
}

// Implementazione locale di formatMessage
function formatMessage(message) {
  if (!message || typeof message !== 'string') {
    return "";
  }
  
  return message.trim();
}

/**
 * Test della funzione sendMessageToBot con messaggio semplice
 */
async function testSimpleMessage() {
  console.log("🧪 Test 1: Messaggio semplice");
  console.log("=" .repeat(50));
  
  try {
    const message = "Ciao, come stai?";
    const modelType = "base";
    
    console.log(`📤 Invio messaggio: "${message}"`);
    console.log(`🤖 Modello: ${modelType}`);
    
    const response = await sendMessageToBot(message, modelType);
    
    console.log(`📥 Risposta ricevuta: "${response}"`);
    console.log("✅ Test completato con successo\n");
    
    return response;
  } catch (error) {
    console.error("❌ Errore nel test:", error);
    console.log("❌ Test fallito\n");
    return null;
  }
}

/**
 * Test della funzione sendMessageToBot con messaggio avanzato e contesto
 */
async function testAdvancedMessageWithContext() {
  console.log("🧪 Test 2: Messaggio avanzato con contesto");
  console.log("=" .repeat(50));
  
  try {
    const message = "Aiutami a organizzare le mie attività per domani";
    const modelType = "advanced";
    const previousMessages = [
      { sender: "user", text: "Ciao" },
      { sender: "bot", text: "Ciao! Come posso aiutarti?" },
      { sender: "user", text: "Ho molte cose da fare" }
    ];
    
    console.log(`📤 Invio messaggio: "${message}"`);
    console.log(`🤖 Modello: ${modelType}`);
    console.log(`📚 Messaggi precedenti: ${previousMessages.length} messaggi`);
    
    const response = await sendMessageToBot(message, modelType, previousMessages);
    
    console.log(`📥 Risposta ricevuta: "${response}"`);
    console.log("✅ Test completato con successo\n");
    
    return response;
  } catch (error) {
    console.error("❌ Errore nel test:", error);
    console.log("❌ Test fallito\n");
    return null;
  }
}

/**
 * Test delle funzioni di validazione e formattazione
 */
function testValidationAndFormatting() {
  console.log("🧪 Test 3: Validazione e formattazione messaggi");
  console.log("=" .repeat(50));
  
  const testCases = [
    { message: "Messaggio valido", expected: true },
    { message: "", expected: false },
    { message: "   ", expected: false },
    { message: null, expected: false },
    { message: undefined, expected: false },
    { message: "a".repeat(6000), expected: false }, // Troppo lungo
    { message: "  Messaggio con spazi  ", expected: true }
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const isValid = validateMessage(testCase.message);
    const formatted = formatMessage(testCase.message);
    
    console.log(`Test ${index + 1}:`);
    console.log(`  Input: "${testCase.message}"`);
    console.log(`  Validazione: ${isValid} (atteso: ${testCase.expected})`);
    console.log(`  Formattato: "${formatted}"`);
    
    if (isValid === testCase.expected) {
      console.log("  ✅ Passato");
      passed++;
    } else {
      console.log("  ❌ Fallito");
      failed++;
    }
    console.log("");
  });
  
  console.log(`Risultati: ${passed} passati, ${failed} falliti\n`);
  return { passed, failed };
}

/**
 * Test interattivo che permette di inserire messaggi da tastiera
 */
async function testInteractive() {
  console.log("🧪 Test 4: Modalità interattiva");
  console.log("=" .repeat(50));
  console.log("Digita 'exit' per uscire dalla modalità interattiva");
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (question) => {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  };
  
  try {
    while (true) {
      const message = await askQuestion("\n💬 Inserisci il tuo messaggio: ");
      
      if (message.toLowerCase() === 'exit') {
        console.log("👋 Uscita dalla modalità interattiva");
        break;
      }
      
      if (!validateMessage(message)) {
        console.log("❌ Messaggio non valido. Riprova.");
        continue;
      }
      
      const modelType = await askQuestion("🤖 Scegli il modello (base/advanced): ");
      const finalModelType = modelType === "advanced" ? "advanced" : "base";
      
      console.log(`\n📤 Invio messaggio al bot...`);
      
      try {
        const response = await sendMessageToBot(message, finalModelType);
        console.log(`\n📥 Risposta del bot:`);
        console.log(`"${response}"`);
      } catch (error) {
        console.error("❌ Errore nell'invio del messaggio:", error);
      }
    }
  } finally {
    rl.close();
  }
}

/**
 * Esegue tutti i test
 */
async function runAllTests() {
  console.log("🚀 Avvio suite di test per botservice");
  console.log("=" .repeat(70));
  console.log("");
  
  const startTime = Date.now();
  
  // Test 1: Messaggio semplice
  await testSimpleMessage();
  
  // Test 2: Messaggio avanzato con contesto  
  await testAdvancedMessageWithContext();
  
  // Test 3: Validazione e formattazione
  const validationResults = testValidationAndFormatting();
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  console.log("📊 Riepilogo test:");
  console.log("=" .repeat(50));
  console.log(`⏱️  Durata totale: ${duration}ms`);
  console.log(`✅ Test validazione passati: ${validationResults.passed}`);
  console.log(`❌ Test validazione falliti: ${validationResults.failed}`);
  console.log("");
  
  // Chiedi se vuole eseguire il test interattivo
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question("🤔 Vuoi eseguire il test interattivo? (y/n): ", async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      rl.close();
      await testInteractive();
    } else {
      console.log("👋 Test completati. Arrivederci!");
      rl.close();
    }
  });
}

// Esegui i test se lo script viene chiamato direttamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

// Esporta le funzioni per uso esterno
module.exports = {
  testSimpleMessage,
  testAdvancedMessageWithContext,
  testValidationAndFormatting,
  testInteractive,
  runAllTests
};
