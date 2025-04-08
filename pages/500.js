import Link from "next/link";
import Head from "next/head";
import { FiHome } from "react-icons/fi";

export default function Custom500() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Server Error - TopDial</title>
        <meta
          name="description"
          content="Something went wrong on our server."
        />
      </Head>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-6xl font-bold text-wine">500</h1>
          <h2 className="text-2xl font-semibold mt-4 mb-2">Server Error</h2>
          <p className="text-gray-600 mb-8">
            Something went wrong on our server. Our team has been notified and
            is working to fix the issue.
          </p>

          <Link
            href="/"
            className="flex items-center justify-center bg-wine text-white px-4 py-2 rounded hover:bg-opacity-90 inline-block"
          >
            <FiHome className="mr-2" /> Return to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
