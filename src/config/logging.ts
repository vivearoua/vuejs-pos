interface LoggingConfig {
  errorReporting: {
    endpoint: string;
    batchSize: number;
    retryAttempts: number;
    retryDelay: number;
    maxRetentionDays: number;
    rotationSizeKB: number;
  };
  production: {
    logLevels: ('error' | 'warn' | 'info')[];
    sampleRate: number;
    maxBatchSize: number;
    flushInterval: number;
  };
}

const config: LoggingConfig = {
  errorReporting: {
    endpoint: process.env.REACT_APP_ERROR_REPORTING_ENDPOINT || 'https://api.pos-app.com/errors',
    batchSize: 50, // Nombre d'erreurs à envoyer par lot
    retryAttempts: 3, // Nombre de tentatives en cas d'échec
    retryDelay: 1000, // Délai entre les tentatives (ms)
    maxRetentionDays: 30, // Durée de conservation des logs
    rotationSizeKB: 1024, // Taille maximale du fichier de log avant rotation
  },
  production: {
    logLevels: ['error', 'warn'], // Ne pas envoyer les logs 'info' en production
    sampleRate: 0.1, // Échantillonnage des logs (10%)
    maxBatchSize: 100, // Taille maximale du lot de logs
    flushInterval: 5000, // Intervalle d'envoi des logs (ms)
  },
};

export default config;
