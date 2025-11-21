import axios from './axiosInterceptor';
import { getValidToken } from './authService';

// Base URL per le API di statistiche (porta 8080 dedicata)
const STATISTICS_BASE_URL = 'http://api.mytasklyapp.com:8080';

/**
 * Ottiene il dashboard completo con tutti i KPI principali
 * @returns {Promise<Object>} Dashboard con productivity overview, priority/status distribution, upcoming deadlines, etc.
 */
export async function getDashboard() {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(`${STATISTICS_BASE_URL}/statistics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero del dashboard:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene la panoramica di produttività
 * @param {number} days - Numero di giorni da analizzare (default: 30, max: 365)
 * @returns {Promise<Object>} KPI di produttività
 */
export async function getProductivityOverview(days: number = 30) {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `${STATISTICS_BASE_URL}/statistics/productivity-overview?days=${days}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero della productivity overview:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene la distribuzione dei task per priorità
 * @returns {Promise<Object>} Distribuzione task per priorità (Bassa/Media/Alta)
 */
export async function getPriorityDistribution() {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(`${STATISTICS_BASE_URL}/statistics/priority-distribution`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero della priority distribution:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene i task con scadenze imminenti
 * @returns {Promise<Object>} Task divisi per timeframe (7/14/30 giorni)
 */
export async function getUpcomingDeadlines() {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(`${STATISTICS_BASE_URL}/statistics/upcoming-deadlines`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero delle upcoming deadlines:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene i task scaduti
 * @returns {Promise<Object>} Task oltre la deadline con giorni di ritardo
 */
export async function getOverdueTasks() {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(`${STATISTICS_BASE_URL}/statistics/overdue-tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero degli overdue tasks:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene lo streak di produttività
 * @returns {Promise<Object>} Giorni consecutivi con almeno un task completato
 */
export async function getProductivityStreak() {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(`${STATISTICS_BASE_URL}/statistics/productivity-streak`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero del productivity streak:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene il riepilogo mensile
 * @param {number} months - Numero di mesi da analizzare (default: 12, max: 24)
 * @returns {Promise<Object>} Task creati/completati per mese
 */
export async function getMonthlySummary(months: number = 12) {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `${STATISTICS_BASE_URL}/statistics/monthly-summary?months=${months}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero del monthly summary:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene la performance per categoria
 * @returns {Promise<Object>} Metriche per ogni categoria con ranking
 */
export async function getCategoryPerformance() {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(`${STATISTICS_BASE_URL}/statistics/category-performance`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero della category performance:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Ottiene il trend di produttività nel tempo
 * @param {number} days - Giorni da analizzare (default: 30, max: 90)
 * @returns {Promise<Object>} Trend con direzione (improving/declining/stable)
 */
export async function getProductivityTrend(days: number = 30) {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `${STATISTICS_BASE_URL}/statistics/productivity-trend?days=${days}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero del productivity trend:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}

/**
 * Confronta periodo corrente vs precedente
 * @param {string} periodType - "week" o "month"
 * @returns {Promise<Object>} Confronto con variazioni percentuali
 */
export async function getPeriodComparison(periodType: 'week' | 'month') {
  try {
    const token = await getValidToken();
    if (!token) {
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `${STATISTICS_BASE_URL}/statistics/period-comparison?period_type=${periodType}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error: any) {
    console.error('❌ Errore nel recupero del period comparison:', error.message);
    return {
      success: false,
      message: error.response?.data?.detail || 'Errore nel recupero delle statistiche',
      error: error,
    };
  }
}
