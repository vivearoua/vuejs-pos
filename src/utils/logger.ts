import { errorReporting } from '../services/errorReporting';
import config from '../config/logging';

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs: number = 1000;
  private readonly environment: string;

  private constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.setupCleanup();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private setupCleanup(): void {
    // Nettoyer les vieux logs tous les jours
    if (this.environment === 'production') {
      setInterval(() => {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.errorReporting.maxRetentionDays);
        
        this.logs = this.logs.filter(log => 
          new Date(log.timestamp) > cutoffDate
        );
      }, 24 * 60 * 60 * 1000); // Une fois par jour
    }
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.environment !== 'production') return true;
    
    // En production, vérifier si le niveau est autorisé
    if (!config.production.logLevels.includes(level)) return false;
    
    // Appliquer l'échantillonnage pour les logs non-critiques
    if (level === 'info') {
      return Math.random() < config.production.sampleRate;
    }
    
    return true;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    // Ajouter au buffer local
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Log dans la console en développement
    if (this.environment === 'development') {
      const consoleMethod = level === 'error' ? console.error :
                          level === 'warn' ? console.warn :
                          console.log;
      consoleMethod(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
    }

    // Reporter les erreurs et avertissements au service de reporting
    if ((level === 'error' || level === 'warn') && this.environment === 'production') {
      errorReporting.reportMessage(message, 'Logger', {
        level,
        data,
        logRotationSize: this.getLogSize(),
        totalLogs: this.logs.length
      });
    }
  }

  private getLogSize(): number {
    // Calculer la taille approximative des logs en Ko
    const logsString = JSON.stringify(this.logs);
    return Math.round(logsString.length / 1024);
  }

  public info(message: string, data?: any) {
    this.log('info', message, data);
  }

  public warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  public error(message: string, data?: any) {
    this.log('error', message, data);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
  }

  // Rotation des logs si nécessaire
  public checkRotation(): void {
    if (this.environment === 'production') {
      const currentSize = this.getLogSize();
      if (currentSize > config.errorReporting.rotationSizeKB) {
        // Garder seulement la moitié la plus récente des logs
        const halfLength = Math.floor(this.logs.length / 2);
        this.logs = this.logs.slice(halfLength);
      }
    }
  }
}

export const logger = Logger.getInstance();
