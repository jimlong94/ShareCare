// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-rose-100">
            <h1 className="text-2xl font-bold text-rose-600 mb-4">Something went wrong.</h1>
            <p className="text-slate-600 mb-4 text-sm">
                We're sorry, the app encountered an error. Please try refreshing the page.
            </p>
            <div className="bg-slate-100 p-4 rounded-xl overflow-auto text-xs font-mono text-slate-600 mb-6 max-h-48">
              {this.state.error && this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
            <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl"
            >
                Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;