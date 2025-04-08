import Link from "next/link";
import Head from "next/head";
import { FiHome, FiSearch } from "react-icons/fi";

export default function Custom404() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>Page Not Found - TopDial</title>
        <meta
          name="description"
          content="The page you're looking for couldn't be found."
        />
      </Head>

      <main className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-6xl font-bold text-wine">404</h1>
          <h2 className="text-2xl font-semibold mt-4 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            We couldn't find the page you're looking for. It might have been
            moved or doesn't exist.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center bg-wine text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              <FiHome className="mr-2" /> Go to Home
            </Link>
            <Link
              href="/listings"
              className="flex items-center justify-center bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              <FiSearch className="mr-2" /> Browse Listings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
