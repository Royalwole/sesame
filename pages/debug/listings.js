import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";

export default function ListingsDebug() {
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSystemInfo() {
      try {
        const response = await fetch("/api/debug/listing-analysis");

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        setSystemInfo(data.analysis);
      } catch (err) {
        console.error("Failed to fetch system info:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSystemInfo();
  }, []);

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <h1 className="text-yellow-800 font-bold">
            Debug Tools Only Available in Development
          </h1>
          <p className="text-yellow-800">
            These debugging tools are only available when running the
            application in development mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Listings Debug Tools</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">Listings Debug Tools</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Link
          href="/debug/listing-validator"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Listing Validator</h2>
          <p className="text-gray-600">
            Test validation rules for listing data without uploading images
          </p>
        </Link>

        <Link
          href="/debug/upload-test"
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold mb-2">Upload Test</h2>
          <p className="text-gray-600">
            Test image uploads to diagnose file upload issues
          </p>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">System Analysis</h2>

        {loading && (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {systemInfo && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Environment</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">
                    Node Environment
                  </div>
                  <div>{systemInfo.environment.nodeEnv}</div>

                  <div className="text-sm font-medium text-gray-500">
                    Running on Vercel
                  </div>
                  <div>{systemInfo.environment.vercel ? "Yes" : "No"}</div>

                  <div className="text-sm font-medium text-gray-500">
                    Blob Storage Configured
                  </div>
                  <div
                    className={
                      systemInfo.environment.blobConfigured
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {systemInfo.environment.blobConfigured ? "Yes" : "No"}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Authentication</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">
                    Authenticated
                  </div>
                  <div>
                    {systemInfo.authentication.authenticated ? "Yes" : "No"}
                  </div>

                  <div className="text-sm font-medium text-gray-500">
                    User Role
                  </div>
                  <div>{systemInfo.authentication.role}</div>

                  <div className="text-sm font-medium text-gray-500">
                    Is Agent
                  </div>
                  <div>{systemInfo.authentication.isAgent ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Listings</h3>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500">
                    Total Listings
                  </div>
                  <div className="text-2xl">{systemInfo.listings.count}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-500">
                    Schema Fields
                  </div>
                  <div className="mt-1 text-xs bg-white p-2 border rounded max-h-40 overflow-auto">
                    {systemInfo.listings.schema.map((field) => (
                      <div key={field} className="border-b py-1">
                        {field}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium text-gray-500">
                    Validation Rules
                  </div>
                  <div className="mt-1">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr>
                          <th className="text-left py-1">Field</th>
                          <th className="text-left py-1">Type</th>
                          <th className="text-left py-1">Message</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {Object.entries(
                          systemInfo.listings.validationRules
                        ).flatMap(([field, rules]) =>
                          rules.map((rule, idx) => (
                            <tr key={`${field}-${idx}`} className="border-b">
                              <td className="py-1 pr-4">{field}</td>
                              <td className="py-1 pr-4">{rule.type}</td>
                              <td className="py-1 pr-4">{rule.message}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
