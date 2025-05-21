import { useState } from "react";
import {
  withAgentAuth,
  withAgentAuthGetServerSideProps,
} from "../../../lib/withAuth";
import { useAuth } from "../../../contexts/AuthContext";
import Head from "next/head";
import AgentLayout from "../../../components/layout/AgentLayout";
import toast from "react-hot-toast";
import { FiEdit, FiSave } from "react-icons/fi";
import { preventAccidentalSubmit } from "../../../lib/form-submission-utils";

function AgentProfile() {
  const { dbUser, user, syncUserData } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: dbUser?.firstName || "",
    lastName: dbUser?.lastName || "",
    phone: dbUser?.phone || "",
    bio: dbUser?.bio || "",
    experience: dbUser?.agentDetails?.experience || "",
    company: dbUser?.agentDetails?.company || "",
    licenseNumber: dbUser?.agentDetails?.licenseNumber || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent accidental form submissions
    if (!preventAccidentalSubmit(e)) {
      return;
    }

    setLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Profile updated successfully");
      setEditing(false);
      // In a real app, you would call an API and then sync user data
      syncUserData();
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Error updating profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentLayout>
      <Head>
        <title>Agent Profile - TopDial</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md flex items-center hover:bg-gray-300"
            >
              <FiEdit className="mr-2" />
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ""}
                    readOnly
                    className="w-full p-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience
                  </label>
                  <select
                    name="experience"
                    value={profileData.experience}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="0-1">Less than 1 year</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={profileData.company}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number (optional)
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={profileData.licenseNumber}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-wine text-white px-4 py-2 rounded-md flex items-center hover:bg-opacity-90 disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-gray-500 text-sm">First Name</h3>
                  <p className="font-medium">{dbUser?.firstName || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">Last Name</h3>
                  <p className="font-medium">{dbUser?.lastName || "N/A"}</p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">Email</h3>
                  <p className="font-medium">
                    {user?.primaryEmailAddress?.emailAddress || "N/A"}
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">Phone</h3>
                  <p className="font-medium">{dbUser?.phone || "N/A"}</p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-gray-500 text-sm">Bio</h3>
                  <p className="text-gray-800">
                    {dbUser?.bio || "No bio provided"}
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">Experience</h3>
                  <p className="font-medium">
                    {dbUser?.agentDetails?.experience || "N/A"}
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">Company</h3>
                  <p className="font-medium">
                    {dbUser?.agentDetails?.company || "N/A"}
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">License Number</h3>
                  <p className="font-medium">
                    {dbUser?.agentDetails?.licenseNumber || "N/A"}
                  </p>
                </div>

                <div>
                  <h3 className="text-gray-500 text-sm">Status</h3>
                  <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded font-semibold">
                    Active Agent
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AgentLayout>
  );
}

// Use withAgentAuth to protect this page
export const getServerSideProps = withAgentAuthGetServerSideProps();

// Export the wrapped component instead of the base component
export default withAgentAuth(AgentProfile);
