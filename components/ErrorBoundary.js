import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);

    // In production, you would send this to a service like Sentry
    if (process.env.NODE_ENV === "production") {
      // Example: sendToErrorService(error, errorInfo);
    }

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
          <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. Our team has been notified of
              this issue.
            </p>
            <button
              onClick={() => (window.location.href = "/")}
              className="bg-wine text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              Return to Home
            </button>

            {process.env.NODE_ENV !== "production" && (
              <div className="mt-6 p-4 bg-red-50 rounded text-sm overflow-auto">
                <p className="font-semibold mb-2">Error Details:</p>
                <p className="mb-2">
                  {this.state.error && this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <pre className="text-xs overflow-x-auto">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
