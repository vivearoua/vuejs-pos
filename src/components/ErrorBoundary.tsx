import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';
import { errorReporting } from '../services/errorReporting';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Component error caught', {
      error: error.message,
      componentStack: errorInfo.componentStack
    });

    // Envoyer l'erreur au service de reporting
    errorReporting.reportError(error, 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
      reactVersion: React.version
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
