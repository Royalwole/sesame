import { useState, useEffect } from "react";
import { withAuth } from "../../../lib/withAuth";
import { useAuth } from "../../../contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import { FiCheck, FiX, FiArrowLeft } from "react-icons/fi";
import Loader from "../../../components/utils/Loader";
import AdminLayout from "../../../components/layout/AdminLayout";

function AdminAgentsPage() {
  const { isAdmin } = useAuth();
  const [pendingAgents, setPendingAgents] = useState([]);
  const [approvedAgents, setApprovedAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/agents");
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to fetch agents");

      setPendingAgents(data.pendingAgents || []);
      setApprovedAgents(data.approvedAgents || []);
    } catch (error) {
      console.error(`Error fetching agents: ${error.message}`);
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agentId) => {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "Failed to approve agent");

      toast.success("Agent approved successfully");
      fetchAgents(); // Refresh the list
    } catch (error) {
      console.error(`Error approving agent: ${error.message}`);
      toast.error("Failed to approve agent");
    }
  };

  const handleReject = async (agentId) => {
    try {
      const response = await fetch(`/api/admin/agents/${agentId}/reject`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to reject agent");

      toast.success("Agent application rejected");
      fetchAgents(); // Refresh the list
    } catch (error) {
      console.error(`Error rejecting agent: ${error.message}`);
      toast.error("Failed to reject agent");
    }
  };

  // Placeholder for real data
  const mockPendingAgents = [
    {
      _id: "1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
      phoneNumber: "+234 800 123 4567",
      agentDetails: {
        experience: "3-5",
        applicationDate: new Date().toISOString(),
      },
    },
    {
      _id: "2",
      firstName: "Sarah",
      lastName: "Smith",
      email: "sarah@example.com",
      profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
      phoneNumber: "+234 800 987 6543",
      agentDetails: {
        experience: "1-3",
        applicationDate: new Date().toISOString(),
      },
    },
  ];

  // Use mock data if API isn't ready
  useEffect(() => {
    if (pendingAgents.length === 0 && approvedAgents.length === 0 && !loading) {
      setPendingAgents(mockPendingAgents);
      setApprovedAgents([]);
    }
  }, [pendingAgents, approvedAgents, loading]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader size="large" />
      </div>
    );
  }

  const agents = tab === "pending" ? pendingAgents : approvedAgents;

  return (
    <AdminLayout title="Manage Agents">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link
            href="/dashboard/admin"
            className="flex items-center text-gray-600 hover:text-wine mr-4"
          >
            <FiArrowLeft className="mr-2" /> Back to Admin Dashboard
          </Link>
          <h1 className="text-2xl font-bold">Manage Agents</h1>
        </div>

        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setTab("pending")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === "pending"
                    ? "border-wine text-wine"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Pending Applications ({pendingAgents.length})
              </button>
              <button
                onClick={() => setTab("approved")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  tab === "approved"
                    ? "border-wine text-wine"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Approved Agents ({approvedAgents.length})
              </button>
            </nav>
          </div>
        </div>

        {agents.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow text-center">
            <p className="text-gray-600">
              {tab === "pending"
                ? "No pending agent applications"
                : "No approved agents yet"}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Application Date
                  </th>
                  {tab === "pending" && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agents.map((agent) => (
                  <tr key={agent._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative rounded-full overflow-hidden">
                          <Image
                            src={
                              agent.profileImage || "/images/default-avatar.jpg"
                            }
                            alt={`${agent.firstName} ${agent.lastName}`}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {agent.firstName} {agent.lastName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{agent.email}</div>
                      <div className="text-sm text-gray-500">
                        {agent.phoneNumber}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.agentDetails?.experience || "N/A"} years
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        agent.agentDetails?.applicationDate
                      ).toLocaleDateString()}
                    </td>
                    {tab === "pending" && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleApprove(agent._id)}
                          className="text-green-600 hover:text-green-900 mr-4"
                        >
                          <FiCheck className="inline mr-1" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(agent._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiX className="inline mr-1" /> Reject
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

// Protect this page with admin authentication
export const getServerSideProps = withAuth({ role: "admin" });

export default AdminAgentsPage;
