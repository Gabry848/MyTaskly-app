/**
 * Script per resettare il Welcome Carousel
 * Esegui: node reset-welcome.js
 *
 * OPPURE usa direttamente nell'app React Native DevTools:
 * AsyncStorage.removeItem('@mytaskly:welcome_carousel_completed')
 */

console.log('📝 Per resettare il Welcome Carousel:');
console.log('');
console.log('1. Apri l\'app in Expo');
console.log('2. Shake il dispositivo (o Cmd+D su iOS, Cmd+M su Android)');
console.log('3. Apri "Debug Remote JS"');
console.log('4. Nella console del browser, esegui:');
console.log('');
console.log('   AsyncStorage.removeItem(\'@mytaskly:welcome_carousel_completed\').then(() => {');
console.log('     console.log(\'✅ Welcome carousel resetted! Riavvia l\'app.\');');
console.log('   });');
console.log('');
console.log('5. Chiudi e riapri l\'app per vedere il carousel');
console.log('');
console.log('OPPURE:');
console.log('');
console.log('Disinstalla e reinstalla l\'app per vedere il flusso first-time completo.');
