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

  private constructor() {
    this.endpoint = process.env.REACT_APP_ERROR_REPORTING_ENDPOINT || 'http://localhost:3001/api/errors';
    this.environment = process.env.NODE_ENV || 'development';
  }

  public static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService();
    }
    return ErrorReportingService.instance;
  }

  public async reportError(error: Error, component: string, additionalInfo?: Record<string, any>): Promise<void> {
    try {
      const errorReport: ErrorReport = {
        timestamp: new Date().toISOString(),
        component,
        message: error.message,
        stack: error.stack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        additionalInfo
      };

      if (this.environment === 'development') {
        console.error('Error Report:', errorReport);
        return;
      }

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });

      if (!response.ok) {
        console.error('Failed to send error report:', await response.text());
      }
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }

  public async reportMessage(message: string, component: string, additionalInfo?: Record<string, any>): Promise<void> {
    await this.reportError(new Error(message), component, additionalInfo);
  }
}

export const errorReporting = ErrorReportingService.getInstance();
