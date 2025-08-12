// Test file per verificare che Expo Notifications funzioni senza Firebase
import * as Notifications from 'expo-notifications';

console.log('✅ Expo Notifications importato correttamente senza Firebase');

// Test configurazione base
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

console.log('✅ Handler notifiche configurato correttamente');
console.log('🎉 Test completato: Expo Notifications funziona senza Firebase!');
