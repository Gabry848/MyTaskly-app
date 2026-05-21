import { DEFAULT_BASE_URL } from '../constants/authConstants';
import { getValidToken } from './authService';

export interface QuickVoiceAddResponse {
  received: boolean;
  recivied?: boolean;
  processing?: boolean;
  model?: 'base' | 'advanced';
  remaining?: {
    voice_daily?: number | string;
    voice_monthly?: number | string;
  };
  rate_limit?: unknown;
  error?: string;
}

function getContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.m4a') || lower.endsWith('.mp4')) return 'audio/mp4';
  if (lower.endsWith('.mp3') || lower.endsWith('.mpeg')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.webm')) return 'audio/webm';
  if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg';
  return 'audio/mp4';
}

function getFileName(uri: string): string {
  const name = uri.split('/').pop();
  return name && name.includes('.') ? name : `quick-voice-add-${Date.now()}.m4a`;
}

export async function sendQuickVoiceAdd(
  audioUri: string,
  model: 'base' | 'advanced' = 'base'
): Promise<QuickVoiceAddResponse> {
  const token = await getValidToken();
  if (!token) {
    throw new Error('Token di autenticazione non disponibile');
  }

  const formData = new FormData();
  formData.append('model', model);
  formData.append('audio', {
    uri: audioUri,
    name: getFileName(audioUri),
    type: getContentType(audioUri),
  } as any);

  const apiUrl = `${process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_BASE_URL}/chat/voice-command`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  let data: QuickVoiceAddResponse | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail = (data as any)?.detail || data?.error || `Errore HTTP ${response.status}`;
    throw new Error(detail);
  }

  return data ?? { received: false, error: 'Risposta non valida dal server' };
}
