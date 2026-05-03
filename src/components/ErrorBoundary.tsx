import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Что-то пошло не так</h1>
            <p className="text-gray-600 mb-6">Произошла ошибка в приложении. Пожалуйста, покажите этот экран разработчику.</p>
            
            <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 mb-6">
              <p className="font-mono text-sm text-red-800 font-bold mb-2">
                {this.state.error?.toString()}
              </p>
              <pre className="font-mono text-xs text-gray-700 whitespace-pre-wrap">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
