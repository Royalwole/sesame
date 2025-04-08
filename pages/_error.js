import { useEffect } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiHome } from "react-icons/fi";

function ErrorPage({ statusCode, hasGetInitialPropsRun, err }) {
  useEffect(() => {
    // Log error to monitoring system
    if (err && process.env.NODE_ENV !== "development") {
      console.error(err);
      // Here you would integrate with your error monitoring service
      // Example: Sentry.captureException(err);
    }
  }, [err]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="flex items-center justify-center text-red-500 mb-6">
          <FiAlertTriangle size={48} />
        </div>

        <h1 className="text-2xl font-semibold text-center mb-2">
          {statusCode ? `Error ${statusCode}` : "An error occurred"}
        </h1>

        <p className="text-gray-600 text-center mb-6">
          {statusCode === 404
            ? "We couldn't find the page you're looking for."
            : "We're sorry, something went wrong on our end."}
        </p>

        <div className="flex justify-center">
          <Link
            href="/"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <FiHome className="mr-2" />
            Return Home
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && err && (
          <div className="mt-8 p-4 bg-gray-100 rounded overflow-auto text-xs">
            <p className="font-semibold mb-2">Development Error Details:</p>
            <pre>{JSON.stringify(err, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true, err };
};

export default ErrorPage;
