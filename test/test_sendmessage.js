const axios = require("axios");

async function testSendMessage() {
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJHYWJyeTg0OCIsInR5cGUiOiJhY2Nlc3MiLCJleHAiOjE3NTM0MzE3MTF9.Qn1AtqSsX2axPszXqSRKYDvXX8Ij61Bz95eoG1jskGI"; // Sostituisci con il tuo token

  const requestPayload = {
    quest: "CIAO COME STAI?",
    model: "advanced",
    previous_messages: [],
  };

  const response = await axios.post(
    "https://taskly-production.up.railway.app/chat/text",
    requestPayload,
    {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "stream",
    }
  );

  const stream = response.data;
  let fullMessage = '';

  stream.on("data", (data) => {
    const text = data.toString('utf8');
    
    // Dividi il testo per linee per gestire più messaggi JSON
    const lines = text.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.startsWith('data: {')) {
        try {
          const jsonStr = line.replace('data: ', '').trim();
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.type === 'content' && parsed.content) {
            fullMessage += parsed.content;
            process.stdout.write(parsed.content); // Mostra il contenuto in real-time
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
    console.log("\nstream done");
  });
}

testSendMessage().catch(console.error);
