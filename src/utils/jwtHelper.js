import dayjs from 'dayjs';

/**
 * Converte una stringa base64 in Uint8Array
 * Implementazione nativa per React Native (no atob/btoa)
 */
function decodeBase64(base64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  let i = 0;

  while (i < base64.length) {
    const a = chars.indexOf(base64[i++]);
    const b = chars.indexOf(base64[i++]);
    const c = chars.indexOf(base64[i++]);
    const d = chars.indexOf(base64[i++]);

    const bitmap = (a << 18) | (b << 12) | (c << 6) | d;

    bytes.push((bitmap >> 16) & 0xff);
    if (c !== 64) bytes.push((bitmap >> 8) & 0xff);
    if (d !== 64) bytes.push(bitmap & 0xff);
  }

  return new Uint8Array(bytes);
}

/**
 * Decodifica un token JWT per ottenere i dati
 * @param {string} token - Il token JWT
 * @return {object} Il payload decodificato o null se non valido
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const bytes = decodeBase64(base64);
    const jsonPayload = decodeURIComponent(Array.from(bytes).map(c => {
      return '%' + ('00' + c.toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Errore nella decodifica del token:', error);
    return null;
  }
}

/**
 * Controlla se un token JWT è scaduto
 * @param {string} token - Il token JWT
 * @return {boolean} True se il token è scaduto, false altrimenti
 */
export function isTokenExpired(token) {
  const decodedToken = decodeToken(token);
  if (!decodedToken || !decodedToken.exp) return true;
  
  // Converti il timestamp Unix in un oggetto dayjs
  const expirationTime = dayjs.unix(decodedToken.exp);
  const currentTime = dayjs();
  
  return currentTime.isAfter(expirationTime);
}
