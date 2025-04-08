import { useState } from "react";
import Head from "next/head";

export default function ListingValidator() {
  const [formData, setFormData] = useState({
    title: "Test Listing",
    description: "This is a test listing for validation",
    propertyType: "house",
    listingType: "sale",
    price: "5000000",
    bedrooms: "3",
    bathrooms: "2",
    address: "123 Test Street",
    city: "Lagos",
    state: "Lagos State",
    country: "Nigeria",
    features: "AC, Security, Generator",
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateListing = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/debug/validate-listing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message,
        details: [{ field: "request", message: "Request failed" }],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Listing Validator - Debug Tool</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">Listing Validation Debug Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl mb-4">Test Form Data</h2>

          <form onSubmit={validateListing} className="space-y-4">
            {Object.entries(formData).map(([key, value]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {key}
                </label>
                {key === "description" ? (
                  <textarea
                    name={key}
                    value={value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    rows={3}
                  />
                ) : (
                  <input
                    type={
                      ["price", "bedrooms", "bathrooms"].includes(key)
                        ? "number"
                        : "text"
                    }
                    name={key}
                    value={value}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? "Validating..." : "Validate Listing"}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl mb-4">Validation Result</h2>

          {!result && (
            <div className="text-gray-500">
              Submit the form to see validation results
            </div>
          )}

          {result && (
            <div>
              <div
                className={`p-3 rounded mb-4 ${
                  result.success
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <span className="font-semibold">Status:</span>{" "}
                {result.success ? "Valid" : "Invalid"}
              </div>

              {result.message && (
                <div className="mb-4">
                  <span className="font-semibold">Message:</span>{" "}
                  {result.message}
                </div>
              )}

              {result.details && result.details.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Validation Details:</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {result.details.map((detail, index) => (
                      <li key={index}>
                        <span className="font-medium">{detail.field}:</span>{" "}
                        {detail.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <h3 className="font-semibold mb-2">Raw Response:</h3>
                <pre className="bg-gray-100 p-3 rounded overflow-auto text-xs h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
