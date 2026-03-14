import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

function reportError(error: Error, errorInfo: ErrorInfo) {
  if (import.meta.env.DEV) {
    console.error("ErrorBoundary caught:", error, errorInfo);
    return;
  }

  // Production: send error via Beacon API (fire-and-forget)
  // To integrate Sentry: replace with Sentry.captureException(error)
  const endpoint = import.meta.env.VITE_ERROR_REPORT_URL;
  if (!endpoint) return;

  try {
    const payload = JSON.stringify({
      message: error.message,
      stack: error.stack?.slice(0, 2000),
      componentStack: errorInfo.componentStack?.slice(0, 2000),
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, payload);
    }
  } catch {
    // Silently fail — already in error state
  }
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-semibold text-foreground">Algo deu errado</h1>
            <p className="text-muted-foreground">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-cta"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
