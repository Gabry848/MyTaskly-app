import "./gesture-handler";
import "@expo/metro-runtime";
import { registerRootComponent } from "expo";
import "fast-text-encoding";
import TrackPlayer from "react-native-track-player";
import { PlaybackService } from "./src/services/PlaybackService";

// Importa Insights
import * as Insights from 'expo-insights';

// Importa il tuo App component
import App from "./src/navigation";

// Opzionale: puoi aggiungere logica condizionale se vuoi 
// che Insights tracci solo in produzione (build EAS)
// if (!__DEV__) {
//   // Configurazione extra se necessaria in futuro
// }

registerRootComponent(App);

// Registra il playback service per react-native-track-player
TrackPlayer.registerPlaybackService(() => PlaybackService);