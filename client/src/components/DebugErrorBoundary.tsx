import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches errors in its child component tree,
 * logs them, and displays a fallback UI instead of crashing the whole application.
 */
export class DebugErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('Error caught by DebugErrorBoundary:', error);
    console.error('Error info:', errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-red-700">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <details className="mt-2">
            <summary className="cursor-pointer text-sm text-red-600">See error details</summary>
            <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-96">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}