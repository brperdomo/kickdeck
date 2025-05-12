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
    
    // Log component stack trace for easier debugging
    const componentStack = errorInfo.componentStack || '';
    console.error('Component stack:', componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 border border-red-200 rounded-lg bg-red-50 text-red-700">
          <h2 className="text-lg font-semibold mb-2">Component Error Detected</h2>
          <p className="text-sm mb-2">An error occurred while rendering this component. Here are the details:</p>
          
          <details className="mt-2" open>
            <summary className="cursor-pointer text-sm font-medium text-red-600">Error details</summary>
            <div className="mt-2 p-3 bg-red-100 rounded text-xs overflow-auto max-h-96">
              <p className="font-bold">Error message:</p>
              <pre className="mt-1 p-2 bg-white/50 rounded">
                {this.state.error?.message || this.state.error?.toString()}
              </pre>
              
              <p className="font-bold mt-2">Error name:</p>
              <pre className="mt-1 p-2 bg-white/50 rounded">
                {this.state.error?.name || 'Unknown error type'}
              </pre>
              
              <p className="font-bold mt-2">Stack trace:</p>
              <pre className="mt-1 p-2 bg-white/50 rounded whitespace-pre-wrap">
                {this.state.error?.stack || 'No stack trace available'}
              </pre>
            </div>
          </details>
          
          <p className="mt-4 text-xs text-red-600">
            Please check the browser console for more detailed error information.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}