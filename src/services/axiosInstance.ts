import axios from 'axios';
import { DEFAULT_BASE_URL } from '../constants/authConstants';

// Crea un'istanza axios separata per evitare cicli di dipendenze
const axiosInstance = axios.create({
  baseURL: DEFAULT_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default axiosInstance;
