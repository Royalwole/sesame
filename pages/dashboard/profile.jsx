import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { withAuthServerSideProps } from "../../lib/withAuth";
import Head from "next/head";
import toast from "react-hot-toast";
import { FiUser, FiMail, FiPhone, FiSave, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { AuthGuard } from "../../lib/withAuth";
import Loader from "../../components/utils/Loader";

function ProfilePage() {
  const { dbUser, isLoading, syncUserData } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixAttempts, setFixAttempts] = useState(0);
  const MAX_FIX_ATTEMPTS = 2;

  // Initialize form with user data when available
  useEffect(() => {
    if (dbUser) {
      setFormData({
        firstName: dbUser.firstName || "",
        lastName: dbUser.lastName || "",
        email: dbUser.email || "",
        phone: dbUser.phone || "",
        bio: dbUser.bio || "",
      });
      // If we have user data, clear any previous errors
      setProfileError(null);
    }
  }, [dbUser]);

  // Ensure user profile exists in the database with retry and timeout mechanisms
  const ensureProfileExists = useCallback(async () => {
    // Skip if we already have user data or have tried too many times
    if (dbUser?.firstName || fixAttempts >= MAX_FIX_ATTEMPTS) return;

    setIsFixing(true);

    try {
      console.log("Fixing user profile to ensure it exists in database...");

      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 5000);

      const response = await fetch('/api/users/fix-profile', {
        signal: abortController.signal
      });

      // Clear the timeout since request completed
      clearTimeout(timeoutId);

      if (response.ok) {
        console.log("Profile fix completed successfully");
        // Refresh user data
        await syncUserData(true);
        setProfileError(null);
      } else {
        const errorText = await response.text();
        console.error(`Error fixing profile: ${response.status}`, errorText);

        // Don't block the UI, but show a recoverable error
        setProfileError({
          message: "Unable to load complete profile data. Some features may be limited.",
          isRecoverable: true
        });
      }
    } catch (error) {
      console.error("Error ensuring profile exists:", error);

      if (error.name === "AbortError") {
        setProfileError({
          message: "Profile verification timed out. You can still update your profile.",
          isRecoverable: true
        });
      } else {
        setProfileError({
          message: "Couldn't verify your profile. You can still make changes.",
          isRecoverable: true
        });
      }
    } finally {
      setIsFixing(false);
      setFixAttempts(prev => prev + 1);
    }
  }, [dbUser, syncUserData, fixAttempts]);

  // Trigger profile verification when component mounts
  useEffect(() => {
    if (!isLoading) {
      ensureProfileExists();
    }
  }, [ensureProfileExists, isLoading]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setIsDirty(true);
  };

  // Save profile changes with proper error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Make sure email is included in the submission even if the field is disabled
    const dataToSubmit = {
      ...formData,
      email: formData.email || dbUser?.email // Ensure email is always included
    };

    try {
      // Create abort controller for timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 8000);

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
        signal: abortController.signal
      });

      // Clear the timeout since request completed
      clearTimeout(timeoutId);

      // Handle different response cases
      if (response.ok) {
        const data = await response.json();

        // Sync user data to get the latest changes
        await syncUserData(true);

        toast.success("Profile updated successfully");
        setIsDirty(false);
        setProfileError(null);
      } else {
        let errorMessage = "Failed to update profile";

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error("Error parsing error response:", jsonError);
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error.name === "AbortError") {
        toast.error("Profile update timed out. Please try again.");
      } else {
        toast.error(error.message || "Failed to update profile");
      }

      // Don't block further edit attempts
      setProfileError({
        message: "Profile update failed, but you can try again.",
        isRecoverable: true
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Force retry profile fix
  const handleRetryProfileFix = async () => {
    setFixAttempts(0); // Reset attempts counter
    await ensureProfileExists(); // Try again
  };

  // Show loading state
  if (isLoading) {
    return <Loader message="Loading your profile..." />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <Head>
          <title>My Profile | TopDial</title>
        </Head>

        <div className="max-w-4xl mx-auto">
          {profileError && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
              <div className="flex items-center">
                <FiAlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                <span className="text-yellow-700">{profileError.message}</span>
                {profileError.isRecoverable && (
                  <button
                    onClick={handleRetryProfileFix}
                    disabled={isFixing}
                    className="ml-auto flex items-center text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  >
                    <FiRefreshCw className={`mr-1 ${isFixing ? 'animate-spin' : ''}`} />
                    {isFixing ? 'Retrying...' : 'Retry'}
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              My Profile
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Info Section */}
              <div className="border-b pb-6">
                <h2 className="text-xl font-semibold mb-4">
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      First Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="First Name"
                        required
                      />
                    </div>
                  </div>

                  {/* Last Name */}
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Last Name
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email Address
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Email"
                        readOnly
                        disabled
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed as it's managed by authentication
                      provider
                    </p>
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Phone Number
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10 block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Phone Number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">About Me</h2>
                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tell us about yourself"
                  />
                </div>
              </div>

              {/* Additional Profile Information - Role & ID */}
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-700 mb-3">
                  Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 block">Account Type:</span>
                    <span className="font-medium">
                      {dbUser?.role
                        ? dbUser.role.charAt(0).toUpperCase() +
                          dbUser.role.slice(1)
                        : "User"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Member Since:</span>
                    <span className="font-medium">
                      {dbUser?.createdAt
                        ? new Date(dbUser.createdAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className={`
                    flex items-center justify-center px-4 py-2 rounded-md
                    ${
                      !isDirty || isSaving
                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }
                  `}
                >
                  <FiSave className="mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

export default ProfilePage;

// Fix the server-side props function to properly wrap or return a valid object with props key
export const getServerSideProps = async (context) => {
  // Use withAuthServerSideProps to protect this page
  const authProps = await withAuthServerSideProps()(context);
  
  // Return the props from withAuthServerSideProps
  return authProps;
};
