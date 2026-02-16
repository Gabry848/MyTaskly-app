# Tutorial System - MyTaskly

Sistema di tutorial interattivo per guidare gli utenti attraverso le funzionalità principali dell'app MyTaskly.

## Architettura

Il sistema di tutorial è basato su `react-native-walkthrough-tooltip` e utilizza un approccio context-based per la gestione dello stato globale.

### Componenti Principali

```
src/components/Tutorial/
├── InteractiveTutorial.tsx      # Componente base per tooltip interattivi
├── TutorialTooltip.tsx          # Wrapper semplificato per applicare tooltip
├── TutorialWelcomeScreen.tsx    # Schermata di benvenuto iniziale
├── index.tsx                     # TutorialManager (legacy - deprecato)
└── exports.ts                    # Esportazioni centralizzate
```

### Context & Hooks

```
src/contexts/TutorialContext.tsx  # Context provider per stato tutorial
src/hooks/useInteractiveTutorial.ts  # Hook per usare il tutorial context
```

### Configurazione

```
src/constants/tutorialContent.ts  # Definizione degli step del tutorial
src/locales/                      # Traduzioni IT/EN
```

## Come Funziona

### 1. Avvio Automatico

Al primo avvio dell'app, viene mostrata automaticamente la `TutorialWelcomeScreen` che offre due opzioni:
- **Inizia il Tour**: Avvia il tutorial interattivo
- **Salta il tour**: Chiude la schermata e salva la preferenza

### 2. Step del Tutorial

Gli step sono definiti in `tutorialContent.ts` e organizzati per schermata:

**Home Screen:**
- `home-text-chat`: Input messaggio chat testuale
- `home-voice-chat`: Pulsante microfono per chat vocale
- `home-chat-history`: Pulsante cronologia conversazioni

**Categories Screen:**
- `categories-general`: Vista categoria generale
- `categories-new-task`: Pulsante creazione task da categoria
- `categories-refresh`: Pulsante aggiorna/sincronizza

**Notes Screen** (da implementare):
- `notes-create`: Creazione nuova nota
- `notes-edit`: Modifica nota esistente
- `notes-move`: Spostamento nota su whiteboard

**Calendar Screen** (da implementare):
- `calendar-switch`: Switch tra vista base e avanzata

### 3. Tooltip Interattivi

Ogni elemento UI chiave è wrappato con `<TutorialTooltip stepKey="...">`:

```tsx
<TutorialTooltip stepKey="home-text-chat">
  <View style={styles.inputContainer}>
    {/* ... elemento UI ... */}
  </View>
</TutorialTooltip>
```

Il tooltip mostra:
- Titolo e descrizione dello step
- Pulsanti navigazione (Avanti/Indietro)
- Opzione "Salta tutorial"
- Posizionamento automatico (top/bottom/left/right)

### 4. Persistenza

Lo stato di completamento del tutorial viene salvato in AsyncStorage:
- Key: `@mytaskly:tutorial_completed`
- Values: `"true"` (completato), `"skipped"` (saltato), `null` (non fatto)

## Utilizzo

### Integrare un Nuovo Step

1. **Aggiungi traduzione** in `src/locales/it.json` e `en.json`:
```json
"tutorial": {
  "steps": {
    "myScreen": {
      "myFeature": {
        "title": "Titolo Feature",
        "description": "Descrizione dettagliata"
      }
    }
  }
}
```

2. **Definisci lo step** in `src/constants/tutorialContent.ts`:
```typescript
{
  key: 'myScreen-myFeature',
  screen: 'MyScreen',
  title: content.myScreen.myFeature.title,
  description: content.myScreen.myFeature.description,
  placement: 'bottom',
}
```

3. **Wrappa l'elemento UI** nella schermata:
```tsx
import { TutorialTooltip } from '../../components/Tutorial/TutorialTooltip';

<TutorialTooltip stepKey="myScreen-myFeature">
  <TouchableOpacity>
    {/* ... */}
  </TouchableOpacity>
</TutorialTooltip>
```

### Riavviare il Tutorial

Gli utenti possono riavviare il tutorial da **Impostazioni > Rivedi Tutorial**. Questo:
- Rimuove il flag di completamento
- Imposta gli step del tutorial
- Avvia il tutorial dall'inizio

## API Context

### TutorialContext

```typescript
interface TutorialContextType {
  isTutorialVisible: boolean;
  shouldAutoStart: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep | null;
  steps: TutorialStep[];
  startTutorial: () => void;
  closeTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
  setSteps: (steps: TutorialStep[]) => void;
  registerElementRef: (key: string, ref: any) => void;
  getElementRef: (key: string) => any;
}
```

### Uso del Context

```tsx
import { useTutorialContext } from '../contexts/TutorialContext';

const { 
  startTutorial, 
  nextStep, 
  currentStep 
} = useTutorialContext();
```

## Personalizzazione Stili

Gli stili dei tooltip sono definiti in `InteractiveTutorial.tsx`:

```typescript
const styles = StyleSheet.create({
  tooltipContent: { padding: 20, maxWidth: 300 },
  tooltipTitle: { fontSize: 18, fontWeight: 'bold' },
  tooltipDescription: { fontSize: 14, color: '#666' },
  primaryButton: { backgroundColor: '#007AFF' },
  // ...
});
```

## Migrazione dal Vecchio Sistema

Il vecchio sistema basato su `TutorialManager` è stato deprecato. Le differenze principali:

| Vecchio | Nuovo |
|---------|-------|
| `TutorialManager` component | `TutorialWelcomeScreen` + `TutorialTooltip` |
| Navigation-based | Context-based |
| Spotlight overlay | Native tooltips |
| Sequenza fissa | Step modulari |
| Pulsante "?" nella Home | Avvio automatico + Settings |

## Troubleshooting

### Il tutorial non si avvia
- Verifica che `TutorialWelcomeScreen` sia montato in `navigation/index.tsx`
- Controlla AsyncStorage per il flag `@mytaskly:tutorial_completed`
- Verifica che gli step siano configurati correttamente

### I tooltip non appaiono
- Verifica che `stepKey` corrisponda a uno step definito
- Controlla che `isTutorialVisible` sia `true` nel context
- Verifica il `currentStep.screen` corrisponda alla schermata corrente

### Errori TypeScript
- Assicurati che `TutorialStep` sia importato da `InteractiveTutorial.tsx`
- Non confondere `TutorialStep` (nuovo) con `OldTutorialStep` (legacy)

## Future Enhancements

- [ ] Completare integrazione Notes e Calendar
- [ ] Aggiungere animazioni personalizzate
- [ ] Tracking analytics completamento tutorial
- [ ] Supporto per tooltip condizionali (es. solo se feature attiva)
- [ ] Tutorial contestuali (es. dopo aver completato un'azione)
