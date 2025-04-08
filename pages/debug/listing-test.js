import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function ListingDebugger() {
  const router = useRouter();
  const { id } = router.query;
  const [testId, setTestId] = useState(id || "");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recentIds, setRecentIds] = useState([]);
  const [queryLog, setQueryLog] = useState([]);

  // Fetch recent IDs when page loads
  useEffect(() => {
    async function fetchRecentIds() {
      try {
        const res = await fetch("/api/debug/id-analysis");
        if (res.ok) {
          const data = await res.json();
          if (data.listings && data.listings.length > 0) {
            setRecentIds(
              data.listings.map((l) => ({
                id: l.stringId,
                title: l.title,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch recent IDs:", err);
      }
    }

    fetchRecentIds();

    // Use ID from URL if provided
    if (id) {
      setTestId(id);
      handleTest(id);
    }
  }, [id]);

  const handleTest = async (idToTest = null) => {
    const targetId = idToTest || testId;
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Add to query log
      setQueryLog((prev) => [
        {
          timestamp: new Date().toLocaleTimeString(),
          id: targetId,
          status: "pending",
        },
        ...prev,
      ]);

      // First try our debug endpoint
      const res = await fetch(`/api/debug/listing-by-id?id=${targetId}`);
      const data = await res.json();

      // Update query log
      setQueryLog((prev) =>
        prev.map((item) =>
          item.id === targetId && item.status === "pending"
            ? {
                ...item,
                status: res.ok ? "success" : "error",
                response: data,
              }
            : item
        )
      );

      if (!res.ok) {
        throw new Error(
          data.error || data.message || "Failed to fetch listing"
        );
      }

      setResult(data);
    } catch (err) {
      console.error("Error testing listing ID:", err);
      setError(err.message || "Failed to test listing ID");
    } finally {
      setLoading(false);
    }
  };

  // Only available in development mode
  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
          <p className="text-yellow-800">
            This debug tool is only available in development mode
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Listing ID Debug Tool</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">Listing ID Debug Tool</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex mb-4 gap-2">
          <input
            type="text"
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            placeholder="Enter listing ID to test"
            className="flex-1 p-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={() => handleTest()}
            disabled={loading || !testId}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test ID"}
          </button>
        </div>

        {recentIds.length > 0 && (
          <div className="mb-4">
            <h3 className="font-medium mb-2">Recent IDs:</h3>
            <div className="flex flex-wrap gap-2">
              {recentIds.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTestId(item.id);
                    handleTest(item.id);
                  }}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full truncate max-w-xs"
                  title={`${item.title} (${item.id})`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">Results</h2>

            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500">
              <h3 className="font-bold text-green-800">
                Found Listing: {result.listing.title}
              </h3>
              <div className="mt-2">
                <div>
                  <span className="font-medium">ID:</span> {result.listing._id}
                </div>
                <div>
                  <span className="font-medium">Query Method:</span>{" "}
                  {result.debug?.approachUsed}
                </div>
              </div>
            </div>

            <h3 className="font-bold mt-4 mb-2">Listing Details</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-x-auto mb-4">
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    id: result.listing._id,
                    title: result.listing.title,
                    price: result.listing.price,
                    address: result.listing.address,
                    city: result.listing.city,
                    status: result.listing.status,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <h3 className="font-bold mt-4 mb-2">Flow Timeline</h3>
            <div className="bg-gray-50 p-4 rounded-md overflow-x-auto max-h-64">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Time (ms)</th>
                    <th className="p-2 text-left">Event</th>
                    <th className="p-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {result.flow?.events.map((event, idx) => (
                    <tr
                      key={idx}
                      className={event.type === "error" ? "bg-red-50" : ""}
                    >
                      <td className="p-2 font-mono">{event.timestamp}</td>
                      <td className="p-2">{event.message}</td>
                      <td className="p-2 max-w-xs truncate">
                        {JSON.stringify(event.data || event.error || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {queryLog.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Query History</h2>
          <div className="overflow-auto max-h-96">
            {queryLog.map((query, idx) => (
              <div
                key={idx}
                className={`mb-4 p-3 border rounded ${
                  query.status === "pending"
                    ? "bg-blue-50 border-blue-300"
                    : query.status === "success"
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-medium mr-2">{query.timestamp}</span>
                    <span className="font-mono text-xs">{query.id}</span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      query.status === "pending"
                        ? "bg-blue-100 text-blue-800"
                        : query.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {query.status}
                  </span>
                </div>
                {query.response && (
                  <button
                    onClick={() => {
                      if (query.status === "success") {
                        setResult(query.response);
                      } else {
                        setError(
                          query.response.error || query.response.message
                        );
                      }
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Show details
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
