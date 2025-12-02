import "./gesture-handler";

import "@expo/metro-runtime"; // Necessary for Fast Refresh on Web
import { registerRootComponent } from "expo";

// Polyfill for TextEncoder/TextDecoder
import "fast-text-encoding";

// Importa il navigatore definito in src/navigation/index.tsx
import App from "./src/navigation";

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
