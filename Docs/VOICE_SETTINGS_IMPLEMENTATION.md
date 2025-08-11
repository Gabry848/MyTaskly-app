# Implementazione Impostazioni Chat Vocale

## Panoramica
È stata implementata una nuova sezione nelle impostazioni dell'app per permettere agli utenti di personalizzare la loro esperienza con la chat vocale.

## Funzionalità Implementate

### 1. Nuova Schermata Impostazioni Vocali (`VoiceSettings.tsx`)
- **Accesso**: Impostazioni → Impostazioni vocali
- **Funzionalità**:
  - Configurazione del modello vocale (Base/Avanzato)
  - Selezione del genere della voce (Femminile/Maschile)
  - Impostazione della qualità audio (Bassa/Media/Alta/Ultra)
  - Salvataggio automatico delle modifiche
  - Sincronizzazione cloud delle impostazioni

### 2. Servizio Impostazioni Vocali (`voiceSettingsService.ts`)
- **Endpoint utilizzati**:
  - `GET /auth/voice-settings` - Recupera impostazioni correnti
  - `PUT /auth/voice-settings` - Aggiorna impostazioni
- **Gestione errori** con fallback su valori di default
- **Validazione** dei valori supportati

### 3. Aggiornamento Servizio Bot (`botservice.ts`)
- **Semplificazione API**: La funzione `sendVoiceMessageToBot` ora richiede solo il file audio e il tipo di modello
- **Gestione automatica**: Le impostazioni vocali vengono applicate automaticamente dal server
- **Retrocompatibilità**: Mantenuta per i componenti esistenti

## Struttura delle Impostazioni

### Opzioni Disponibili
```typescript
{
  voice_model: 'base' | 'advanced',
  voice_gender: 'female' | 'male', 
  voice_quality: 'low' | 'medium' | 'high' | 'ultra'
}
```

### Valori di Default
- **Modello**: Base
- **Genere**: Femminile
- **Qualità**: Media

## Esperienza Utente

### Design
- **Interfaccia moderna** con selezione chiara delle opzioni
- **Feedback visivo** per le opzioni selezionate
- **Loading states** durante il caricamento e salvataggio
- **Icone intuitive** per ogni sezione

### Comportamento
- **Salvataggio automatico** quando l'utente seleziona un'opzione
- **Sincronizzazione immediata** con il server
- **Gestione errori** con ripristino automatico in caso di problemi
- **Loading indicator** durante le operazioni di rete

## Integrazione

### Navigazione
- Aggiunta voce "Impostazioni vocali" nel menu Impostazioni → Generale
- Icona microfono per identificazione immediata
- Navigazione fluida con header personalizzato

### API
- Le impostazioni vengono automaticamente utilizzate dall'endpoint `/chat/voice-bot`
- Non è più necessario passare parametri vocali nelle richieste
- Il server utilizza le impostazioni salvate dell'utente autenticato

## Vantaggi

### Per l'Utente
- **Personalizzazione completa** dell'esperienza vocale
- **Impostazioni persistenti** tra sessioni e dispositivi
- **Interfaccia semplice e intuitiva**

### Per lo Sviluppo
- **Codice più pulito** senza parametri vocali hardcoded
- **Gestione centralizzata** delle impostazioni vocali
- **Facilità di manutenzione** e aggiornamenti futuri

## File Modificati

### Nuovi File
- `src/services/voiceSettingsService.ts` - Servizio per gestione impostazioni
- `src/navigation/screens/VoiceSettings.tsx` - Schermata impostazioni vocali

### File Aggiornati
- `src/navigation/screens/Settings.tsx` - Aggiunta voce menu
- `src/navigation/index.tsx` - Registrazione nuova schermata
- `src/types.d.ts` - Aggiunta tipo VoiceSettings
- `src/services/botservice.ts` - Semplificazione API vocale
- `components/VoiceChatModal.tsx` - Aggiornamento chiamate API

## Test e Utilizzo

### Come Testare
1. Aprire l'app e andare in Impostazioni
2. Selezionare "Impostazioni vocali"
3. Modificare le varie opzioni
4. Verificare che le modifiche vengano salvate automaticamente
5. Utilizzare la chat vocale per testare le impostazioni applicate

### Risoluzione Problemi
- Se le impostazioni non si caricano, l'app utilizza valori di default
- In caso di errori di salvataggio, viene mostrato un alert e le impostazioni vengono ripristinate
- Le impostazioni sono sincronizzate automaticamente tra dispositivi

## Prossimi Sviluppi Possibili
- Anteprima vocale per testare le impostazioni
- Impostazioni avanzate per velocità di lettura
- Personalizzazione per lingua/accento
- Preset predefiniti per diversi casi d'uso
