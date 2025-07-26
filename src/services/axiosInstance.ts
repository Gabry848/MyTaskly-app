import axios from 'axios';

// Crea un'istanza axios separata per evitare cicli di dipendenze
const axiosInstance = axios.create();

export default axiosInstance;
