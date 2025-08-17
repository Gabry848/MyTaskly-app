import Voice from '@react-native-voice/voice';
import { useEffect, useState } from 'react';

export default function useVoiceInput() {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    Voice.onSpeechResults = (e) => {
      setText(e.value?.[0] ?? '');
    };
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const start = async () => {
    setText('');
    setIsListening(true);
    await Voice.start('it-IT');
  };

  const stop = async () => {
    setIsListening(false);
    await Voice.stop();
  };

  return { text, isListening, start, stop };
}