import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import BlobUploadTest from "../../components/utils/BlobUploadTest";
import { FiArrowLeft } from "react-icons/fi";

export default function BlobUploadPage() {
  const [uploads, setUploads] = useState([]);

  const handleUploadComplete = (result) => {
    setUploads((prev) => [result, ...prev]);
  };

  return (
    <>
      <Head>
        <title>Blob Upload Test | TopDial Debug</title>
      </Head>

      <div className="container mx-auto p-4">
        <div className="mb-4">
          <Link
            href="/debug/storage-status"
            className="flex items-center text-blue-600 hover:underline"
          >
            <FiArrowLeft className="mr-1" /> Back to Storage Status
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6">Blob Upload Test</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <BlobUploadTest
              folder="debug"
              onUploadComplete={handleUploadComplete}
            />
          </div>

          <div className="bg-white p-4 border rounded-md">
            <h3 className="text-lg font-medium mb-4">Upload History</h3>

            {uploads.length === 0 ? (
              <p className="text-gray-500">
                No uploads yet. Use the form to upload files.
              </p>
            ) : (
              <div className="space-y-3">
                {uploads.map((upload, index) => (
                  <div key={index} className="border rounded-md p-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">{upload.filename}</div>
                      <div className="text-xs text-gray-500">
                        {Math.round(upload.size / 1024)} KB
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 break-all">
                      <a
                        href={upload.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {upload.url}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-md">
          <h2 className="font-medium mb-2">Implementation Notes</h2>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
            <li>
              This uses the <code>put</code> method from{" "}
              <code>@vercel/blob</code> for uploads
            </li>
            <li>
              Files are stored in the <code>debug/[userId]</code> folder
            </li>
            <li>
              All uploads are set to <code>access: 'public'</code>
            </li>
            <li>Check the network tab to see the API request/response cycle</li>
          </ul>
        </div>
      </div>
    </>
  );
}
