import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[React Error Boundary] Caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg border border-[#DBDBDB] text-center">
            <AlertTriangle className="w-12 h-12 text-[#A65300] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#191919] mb-2">Something went wrong</h2>
            <p className="text-sm text-[#666666] mb-6">
              The application encountered an unexpected error. Our systems have been notified.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-[#F9FAFB] border border-[#DBDBDB] rounded text-left overflow-auto text-xs text-[#A65300]">
                {this.state.error?.toString()}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
