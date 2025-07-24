# Test Scripts per BotService

Questa cartella contiene gli script di test per la funzione `sendMessageToBot` del servizio bot di Taskly.

## File di Test

### 1. `test_botservice.js`
Script JavaScript completo con multiple funzionalità di test:

- **Test messaggio semplice**: Invia un messaggio base al bot
- **Test messaggio avanzato con contesto**: Testa l'invio con messaggi precedenti
- **Test validazione e formattazione**: Verifica le funzioni di utilità
- **Modalità interattiva**: Permette di testare messaggi personalizzati da console

#### Come eseguire:
```bash
node test/test_botservice.js
```

### 2. `test_botservice.ts`
Script TypeScript più focalizzato sui test di performance e funzionalità core:

- **Test singoli messaggi**: Con diversi tipi di modello
- **Test con contesto**: Verifica il comportamento con messaggi precedenti
- **Test di performance**: Misura tempi di risposta multipli

#### Come eseguire:
```bash
npx ts-node test/test_botservice.ts
```

### 3. `test_sendmessage.js` (esistente)
Script di test diretto che testa l'endpoint HTTP senza passare per il servizio.

## Funzionalità Testate

### Funzione sendMessageToBot
- ✅ Invio messaggi semplici
- ✅ Invio messaggi con modello avanzato
- ✅ Gestione contesto (messaggi precedenti)
- ✅ Gestione errori di autenticazione
- ✅ Gestione streaming delle risposte
- ✅ Misurazione performance

### Funzioni di Utilità
- ✅ `validateMessage()` - Validazione messaggi
- ✅ `formatMessage()` - Formattazione messaggi
- ✅ Gestione messaggi troppo lunghi
- ✅ Gestione input non validi

## Configurazione

### Prerequisiti
1. **Token di autenticazione**: Gli script utilizzano il servizio `authService` per ottenere il token
2. **Server attivo**: Il server Taskly deve essere raggiungibile
3. **Dipendenze**: Assicurati che tutte le dipendenze npm siano installate

### Modifica Token (per test diretti)
Se vuoi testare con un token specifico, modifica il mock nel file JavaScript:

```javascript
const mockToken = "IL_TUO_TOKEN_QUI";
```

## Esempi di Output

### Test Riuscito
```
🧪 Test 1: Messaggio semplice
==================================================
📤 Invio messaggio: "Ciao, come stai?"
🤖 Modello: base
📥 Risposta ricevuta: "Ciao! Sto bene, grazie per aver chiesto..."
✅ Test completato con successo
```

### Test con Errore
```
❌ Errore nel test: Sessione scaduta. Effettua nuovamente il login.
❌ Test fallito
```

## Troubleshooting

### Problemi Comuni

1. **Errore di autenticazione**
   - Verifica che il token sia valido
   - Controlla che il servizio `authService` funzioni correttamente

2. **Timeout o errori di rete**
   - Verifica la connessione internet
   - Controlla che il server sia attivo

3. **Errori di importazione**
   - Assicurati che il percorso ai servizi sia corretto
   - Verifica che tutte le dipendenze siano installate

4. **Errori TypeScript**
   - Usa `npx ts-node` per eseguire i file .ts
   - Verifica la configurazione TypeScript del progetto

## Estensioni Future

Possibili miglioramenti ai test:

- **Test di carico**: Verificare il comportamento con molte richieste simultanee
- **Test di resilienza**: Simulare errori di rete e recovery
- **Test A/B**: Confrontare performance tra modelli base e avanzato
- **Test integrazione**: Verificare il comportamento end-to-end con l'UI
- **Mock server**: Creare un server mock per test offline

## Note per Sviluppatori

- Usa `test_botservice.js` per test rapidi e debug interattivo
- Usa `test_botservice.ts` per test automatizzati e CI/CD
- Modifica i messaggi di test per adattarli alle tue esigenze
- Aggiungi nuovi test per nuove funzionalità del bot
