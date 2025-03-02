import dayjs from 'dayjs';

/**
 * Decodifica un token JWT per ottenere i dati
 * @param {string} token - Il token JWT
 * @return {object} Il payload decodificato o null se non valido
 */
export function decodeToken(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
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
