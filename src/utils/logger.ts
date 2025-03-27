import { errorReporting } from '../services/errorReporting';

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

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, data?: any) {
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
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? console.error :
                          level === 'warn' ? console.warn :
                          console.log;
      consoleMethod(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, data || '');
    }

    // Reporter les erreurs et avertissements au service de reporting
    if (level === 'error' || level === 'warn') {
      errorReporting.reportMessage(message, 'Logger', {
        level,
        data
      });
    }
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
}

export const logger = Logger.getInstance();
