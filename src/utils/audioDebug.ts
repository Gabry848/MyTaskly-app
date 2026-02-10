/**
 * Utility di debug per verificare che le dipendenze audio siano correttamente installate
 */

export function debugAudioDependencies() {
  console.log('=== DEBUG AUDIO DEPENDENCIES ===');
  
  try {
    // Test import expo-audio
    const expoAudio = require('expo-audio');
    console.log('✅ expo-audio importato correttamente');
    console.log('createAudioPlayer:', !!expoAudio?.createAudioPlayer);
    console.log('setAudioModeAsync:', !!expoAudio?.setAudioModeAsync);
    console.log('requestRecordingPermissionsAsync:', !!expoAudio?.requestRecordingPermissionsAsync);
  } catch (error) {
    console.error('❌ Errore import expo-audio:', error);
  }
  
  try {
    // Test import expo-file-system
    const FileSystem = require('expo-file-system');
    console.log('✅ expo-file-system importato correttamente');
    console.log('FileSystem object:', !!FileSystem);
    console.log('FileSystem.readAsStringAsync:', !!FileSystem?.readAsStringAsync);
    console.log('FileSystem.writeAsStringAsync:', !!FileSystem?.writeAsStringAsync);
    console.log('FileSystem.documentDirectory:', FileSystem?.documentDirectory);
    console.log('FileSystem.EncodingType:', !!FileSystem?.EncodingType);
    console.log('FileSystem.EncodingType.Base64:', FileSystem?.EncodingType?.Base64);
  } catch (error) {
    console.error('❌ Errore import expo-file-system:', error);
  }
  
  try {
    // Test import WebSocket
    console.log('✅ WebSocket nativo disponibile:', !!WebSocket);
  } catch (error) {
    console.error('❌ WebSocket non disponibile:', error);
  }
  
  console.log('=== FINE DEBUG ===');
}

/**
 * Funzione per testare l'accesso ai permessi audio
 */
export async function debugAudioPermissions() {
  console.log('=== DEBUG AUDIO PERMISSIONS ===');
  
  try {
    const { requestRecordingPermissionsAsync } = require('expo-audio');
    const result = await requestRecordingPermissionsAsync();
    console.log('Risultato richiesta permessi:', result);
    console.log('Permessi concessi:', result.granted);
    console.log('Status:', result.status);
  } catch (error) {
    console.error('❌ Errore verifica permessi:', error);
  }
  
  console.log('=== FINE DEBUG PERMESSI ===');
}

/**
 * Funzione per testare la disponibilità di FileSystem
 */
export async function debugFileSystem() {
  console.log('=== DEBUG FILE SYSTEM ===');
  
  try {
    const FileSystem = require('expo-file-system');
    
    if (FileSystem?.documentDirectory) {
      console.log('Document directory:', FileSystem.documentDirectory);
      
      // Test scrittura/lettura file
      const testFile = `${FileSystem.documentDirectory}test_audio_debug.txt`;
      const testData = 'test data for audio debug';
      
      await FileSystem.writeAsStringAsync(testFile, testData);
      console.log('✅ File di test scritto');
      
      const readData = await FileSystem.readAsStringAsync(testFile);
      console.log('✅ File di test letto:', readData === testData);
      
      // Test base64
      const base64Data = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      const base64File = `${FileSystem.documentDirectory}test_base64.txt`;
      
      await FileSystem.writeAsStringAsync(base64File, base64Data, {
        encoding: FileSystem.EncodingType.Base64
      });
      console.log('✅ File base64 scritto');
      
      const readBase64 = await FileSystem.readAsStringAsync(base64File, {
        encoding: FileSystem.EncodingType.Base64
      });
      console.log('✅ File base64 letto:', readBase64 === base64Data);
      
    } else {
      console.error('❌ Document directory non disponibile');
    }
  } catch (error) {
    console.error('❌ Errore test FileSystem:', error);
  }
  
  console.log('=== FINE DEBUG FILE SYSTEM ===');
}
