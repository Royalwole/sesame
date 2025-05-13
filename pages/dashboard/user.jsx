import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "../../contexts/AuthContext";
import UserDashboard from "../../components/dashboard/UserDashboard";
import { withAuth } from "../../lib/withAuth";

function UserDashboardPage() {
  const router = useRouter();
  const auth = useAuth();
  const { dbUser, isLoading, isAgent, isAdmin } = auth;

  // Ensure agents and admins are redirected to their proper dashboards
  // This is a safety check in case they somehow end up on the user dashboard
  useEffect(() => {
    if (!isLoading) {
      // Get direct access to role and approval from user metadata
      const userRole = auth?.user?.publicMetadata?.role;
      const isApproved = auth?.user?.publicMetadata?.approved === true;
      
      // Only redirect if both role appropriate AND approved
      if (isAgent && isApproved) {
        console.log("Approved agent detected in user dashboard, redirecting to agent dashboard");
        router.replace("/dashboard/agent/index");
      } else if (isAdmin && isApproved) {
        console.log("Approved admin detected in user dashboard, redirecting to admin dashboard");
        router.replace("/dashboard/admin");
      } else if ((isAgent || isAdmin) && !isApproved) {
        console.log("User has role but not approved, staying on user dashboard");
      }
    }
  }, [isLoading, isAgent, isAdmin, router, auth.user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Safety check - if user has agent or admin role, show loading instead of user dashboard
  if (isAgent || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>User Dashboard | Topdial</title>
        <meta name="description" content="Manage your Topdial account" />
      </Head>

      <UserDashboard user={dbUser} />
    </>
  );
}

// Protect this route for authenticated users
export default withAuth()(UserDashboardPage);
