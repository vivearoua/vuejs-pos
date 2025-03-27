import config from '../config/logging';

interface ErrorReport {
  timestamp: string;
  component: string;
  message: string;
  stack?: string;
  userAgent: string;
  url: string;
  additionalInfo?: Record<string, any>;
}

class ErrorReportingService {
  private static instance: ErrorReportingService;
  private readonly endpoint: string;
  private readonly environment: string;
  private queue: ErrorReport[] = [];
  private retryCount: number = 0;
  private flushTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.endpoint = process.env.REACT_APP_ERROR_REPORTING_ENDPOINT || config.errorReporting.endpoint;
    this.environment = process.env.NODE_ENV || 'development';
    this.startAutoFlush();
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  private startAutoFlush(): void {
    if (this.environment === 'production') {
      this.flushTimeout = setInterval(() => {
        this.flushQueue();
      }, config.production.flushInterval);
    }
  }

  private async flushQueue(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, config.errorReporting.batchSize);
    
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`Failed to send error reports: ${response.statusText}`);
      }

      this.retryCount = 0; // Réinitialiser le compteur après un succès
    } catch (err) {
      console.error('Failed to send error reports:', err);
      
      // Remettre les erreurs dans la queue si on n'a pas dépassé le nombre max de tentatives
      if (this.retryCount < config.errorReporting.retryAttempts) {
        this.queue.unshift(...batch);
        this.retryCount++;
        
        // Réessayer après un délai
        setTimeout(() => {
          this.flushQueue();
        }, config.errorReporting.retryDelay * this.retryCount);
      } else {
        console.error('Max retry attempts reached, discarding error reports');
        this.retryCount = 0;
      }
    }
  }

  private shouldSampleError(): boolean {
    if (this.environment !== 'production') return true;
    return Math.random() < config.production.sampleRate;
  }

  public async reportError(error: Error, component: string, additionalInfo?: Record<string, any>): Promise<void> {
    if (!this.shouldSampleError()) return;

    const errorReport: ErrorReport = {
      timestamp: new Date().toISOString(),
      component,
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalInfo: {
        ...additionalInfo,
        environment: this.environment,
        version: process.env.REACT_APP_VERSION || 'unknown'
      }
    };

    if (this.environment === 'development') {
      console.error('Error Report:', errorReport);
      return;
    }

    this.queue.push(errorReport);

    // Si la queue dépasse la taille maximale, forcer un flush
    if (this.queue.length >= config.production.maxBatchSize) {
      this.flushQueue();
    }
  }

  public async reportMessage(message: string, component: string, additionalInfo?: Record<string, any>): Promise<void> {
    await this.reportError(new Error(message), component, additionalInfo);
  }

  // Nettoyage lors de la fermeture de l'application
  public cleanup(): void {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
    }
    this.flushQueue(); // Envoyer les erreurs restantes
  }
}

export const errorReporting = ErrorReportingService.getInstance();
