import { useState } from "react";
import Head from "next/head";

export default function IdCheck() {
  const [id, setId] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkId = async () => {
    if (!id.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/debug/id-analysis?id=${id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to analyze ID");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showRecentIds = async () => {
    setLoading(true);
    setError(null);
    setId("");

    try {
      const res = await fetch("/api/debug/id-analysis");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch recent IDs");
      }

      setAnalysis({
        recentListings: data.listings,
        listingCount: data.listingCount,
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
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
        <title>MongoDB ID Debug Tool</title>
      </Head>

      <h1 className="text-2xl font-bold mb-6">MongoDB ID Analysis Tool</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Check Specific Listing ID
          </label>
          <div className="flex">
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="Enter a listing ID"
              className="flex-1 p-2 border border-gray-300 rounded-l"
            />
            <button
              onClick={checkId}
              disabled={loading || !id.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Checking..." : "Check ID"}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={showRecentIds}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Show Recent Listing IDs
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {analysis && (
          <div className="border rounded overflow-hidden">
            <div className="bg-gray-100 p-3 font-semibold">
              Analysis Results
            </div>
            <div className="p-4">
              {analysis.providedId ? (
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold">Provided ID:</div>
                    <div className="font-mono text-sm">
                      {analysis.providedId}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold">Is Valid ObjectID:</div>
                    <div
                      className={`font-mono ${
                        analysis.isValidObjectId
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {analysis.isValidObjectId ? "Yes ✓" : "No ✗"}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold">Matches Found:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        Object ID Match:{" "}
                        {analysis.objectIdMatchFound ? "Yes ✓" : "No ✗"}
                      </div>
                      <div>
                        String ID Match:{" "}
                        {analysis.stringIdMatchFound ? "Yes ✓" : "No ✗"}
                      </div>
                    </div>
                  </div>

                  {analysis.matchingListing && (
                    <div>
                      <div className="font-semibold">Matching Listing:</div>
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="mb-1">
                          <span className="font-medium">Title:</span>{" "}
                          {analysis.matchingListing.title}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">ID:</span>{" "}
                          <span className="font-mono text-sm">
                            {analysis.matchingListing.id}
                          </span>
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Status:</span>{" "}
                          {analysis.matchingListing.status}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            analysis.matchingListing.createdAt
                          ).toLocaleString()}
                        </div>
                        <div className="mt-2 font-medium">
                          ID Match:
                          <span
                            className={
                              analysis.matchingListing.isExactMatch
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {analysis.matchingListing.isExactMatch
                              ? " Exact Match ✓"
                              : " Not Exact Match ✗"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                analysis.recentListings && (
                  <div>
                    <h3 className="font-medium mb-3">
                      Recent Listings ({analysis.listingCount})
                    </h3>
                    <div className="space-y-4">
                      {analysis.recentListings.map((listing, index) => (
                        <div key={index} className="border p-3 rounded">
                          <div className="mb-1">
                            <span className="font-medium">Title:</span>{" "}
                            {listing.title}
                          </div>
                          <div className="mb-1">
                            <span className="font-medium">ID:</span>
                            <span className="font-mono text-sm break-all">
                              {listing.stringId}
                            </span>
                          </div>
                          <button
                            onClick={() => setId(listing.stringId)}
                            className="mt-2 text-sm text-blue-600 hover:underline"
                          >
                            Use this ID
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
