type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(level: LogLevel, message: string, details?: any): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      details
    };
  }

  private saveLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    
    // Save to localStorage in development
    if (process.env.NODE_ENV === 'development') {
      try {
        localStorage.setItem('app_logs', JSON.stringify(this.logs));
      } catch (e) {
        console.warn('Failed to save logs to localStorage:', e);
      }
    }
  }

  info(message: string, details?: any) {
    const entry = this.formatLog('info', message, details);
    this.saveLog(entry);
    console.log(`[INFO] ${message}`, details || '');
  }

  warn(message: string, details?: any) {
    const entry = this.formatLog('warn', message, details);
    this.saveLog(entry);
    console.warn(`[WARN] ${message}`, details || '');
  }

  error(message: string, error?: Error | any) {
    const entry = this.formatLog('error', message, error);
    this.saveLog(entry);
    console.error(`[ERROR] ${message}`, error || '');
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    if (process.env.NODE_ENV === 'development') {
      localStorage.removeItem('app_logs');
    }
  }
}

export const logger = Logger.getInstance();
