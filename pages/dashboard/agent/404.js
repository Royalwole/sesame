import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import AgentLayout from "../../../components/layout/AgentLayout";
import { FiAlertTriangle } from "react-icons/fi";
import {
  withAgentAuth,
  withAgentAuthGetServerSideProps,
} from "../../../lib/withAuth";

function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // Log the 404 for debugging purposes
    console.log("404 Error - Agent Dashboard Path:", router.asPath);
  }, [router.asPath]);

  return (
    <AgentLayout>
      <Head>
        <title>Page Not Found - Agent Dashboard</title>
      </Head>

      <div className="container mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FiAlertTriangle className="mx-auto text-yellow-500 mb-4" size={64} />
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8">
            The agent dashboard page you're looking for doesn't exist or has
            been moved.
          </p>

          <div className="flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-4">
            <Link
              href="/dashboard/agent"
              className="bg-wine text-white px-6 py-2 rounded-md hover:bg-opacity-90"
            >
              Go to Agent Dashboard
            </Link>
            <Link
              href="/dashboard/agent/listings"
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              View My Listings
            </Link>
          </div>
        </div>
      </div>
    </AgentLayout>
  );
}

// Add server-side authentication
export const getServerSideProps = withAgentAuthGetServerSideProps();

// Export the component wrapped with authentication
export default withAgentAuth(Custom404);
