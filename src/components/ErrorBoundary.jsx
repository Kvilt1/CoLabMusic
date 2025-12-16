import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep logging for developers; UI fallback is for users.
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const showDevDetails =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-lg bg-[#181818] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/25">
              <span className="text-emerald-400 font-black">!</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Something went wrong</h1>
              <p className="text-sm text-gray-400">The app hit an unexpected error.</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={this.handleReset}
              className="flex-1 bg-emerald-500 text-black font-bold py-2.5 rounded-xl hover:bg-emerald-400 transition"
            >
              Try again
            </button>
            <button
              onClick={this.handleReload}
              className="flex-1 bg-[#2a2a2a] text-white font-bold py-2.5 rounded-xl hover:bg-[#333] transition border border-white/10"
            >
              Reload
            </button>
          </div>

          {showDevDetails && (
            <details className="mt-6 text-sm text-gray-300">
              <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
                Developer details
              </summary>
              <pre className="mt-3 p-4 rounded-xl bg-black/40 border border-white/10 overflow-auto text-xs leading-relaxed">
                {(this.state.error && (this.state.error.stack || this.state.error.message)) ||
                  'No error details'}
                {'\n\n'}
                {(this.state.errorInfo && this.state.errorInfo.componentStack) || ''}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}


