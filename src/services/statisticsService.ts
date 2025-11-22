import axios from './axiosInterceptor';

/**
 * Ottiene il dashboard completo con tutti i KPI principali
 * @returns {Promise<Object>} Dashboard con productivity overview, priority/status distribution, upcoming deadlines, etc.
 */
export async function getDashboard() {
  try {
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getDashboard: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get('/statistics/dashboard', {
      headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getProductivityOverview: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `/statistics/productivity-overview?days=${days}`,
      {
        headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getPriorityDistribution: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get('/statistics/priority-distribution', {
      headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getUpcomingDeadlines: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get('/statistics/upcoming-deadlines', {
      headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getOverdueTasks: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get('/statistics/overdue-tasks', {
      headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getProductivityStreak: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get('/statistics/productivity-streak', {
      headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getMonthlySummary: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `/statistics/monthly-summary?months=${months}`,
      {
        headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getCategoryPerformance: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get('/statistics/category-performance', {
      headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getProductivityTrend: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `/statistics/productivity-trend?days=${days}`,
      {
        headers: {
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
    const { checkAndRefreshAuth } = await import('./authService');
    const authStatus = await checkAndRefreshAuth();

    if (!authStatus.isAuthenticated) {
      console.log('[STATISTICS_SERVICE] getPeriodComparison: utente non autenticato');
      return {
        success: false,
        message: 'Token di autenticazione non valido',
      };
    }

    const response = await axios.get(
      `/statistics/period-comparison?period_type=${periodType}`,
      {
        headers: {
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
