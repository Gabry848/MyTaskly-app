import './gesture-handler';

import '@expo/metro-runtime'; // Necessary for Fast Refresh on Web
import { registerRootComponent } from 'expo';

// Polyfill for TextEncoder/TextDecoder - avoid circular reference on React Native
if (typeof global.TextEncoder === 'undefined') {
  try {
    const { TextEncoder, TextDecoder } = require('util');
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
  } catch (e) {
    // If util is not available, use native browser APIs or custom implementation
    if (typeof global.TextEncoder === 'undefined') {
      global.TextEncoder = class TextEncoder {
        encode(str) {
          const buf = Buffer.alloc(str.length);
          for (let i = 0; i < str.length; i++) {
            buf[i] = str.charCodeAt(i);
          }
          return new Uint8Array(buf);
        }
      };
    }
  }
}

// Importa il navigatore definito in src/navigation/index.tsx
import App from './src/navigation';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);