import { useState } from "react";
import { useRouter } from "next/router";
import { withAuth } from "../../lib/withAuth";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import Link from "next/link";
import ImageUpload from "../../components/listings/ImageUpload";

function BecomeAgent() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState([]);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.primaryEmailAddress?.emailAddress || "",
    phone: "",
    bio: "",
    experience: "0-1",
    licenseNumber: "",
    company: "",
    address: "",
    city: "",
    state: "",
    agreeToTerms: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (files) => {
    setProfileImage(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.agreeToTerms) {
      toast.error("You must agree to the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      // Create form data with all fields
      const submitData = new FormData();

      // Add form fields
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value || "");
      });

      // Add profile image if selected
      if (profileImage.length > 0) {
        submitData.append("profileImage", profileImage[0]);
      }

      console.log("Submitting agent application form...");

      // Send application to server with credentials included
      const response = await fetch("/api/users/become-agent", {
        method: "POST",
        body: submitData,
        credentials: "include", // Ensure cookies are sent with request
      });

      console.log("Response status:", response.status);

      // Handle response
      let result;
      try {
        result = await response.json();
        console.log("Response data:", result);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error(`Invalid server response: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMessage =
          result.error || result.message || "Something went wrong";
        console.error("Server returned error:", result);
        throw new Error(errorMessage);
      }

      toast.success("Agent application submitted successfully!");

      // Redirect to dashboard after success
      setTimeout(() => {
        router.push("/dashboard?agent_applied=true");
      }, 1500);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error(error.message || "Failed to submit agent application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link
          href="/dashboard"
          className="flex items-center text-gray-600 hover:text-wine mr-4"
        >
          <FiArrowLeft className="mr-2" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold">Become an Agent</h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">
            Why Join TopDial as an Agent?
          </h2>
          <p className="text-gray-600">
            Join our network of professional agents and gain access to a wide
            audience of property seekers. Becoming a TopDial agent gives you
            tools to manage listings, connect with clients, and grow your real
            estate business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border border-gray-200 rounded-md p-4">
            <div className="font-semibold mb-2">✨ Enhanced Visibility</div>
            <p className="text-sm text-gray-600">
              Get your listings in front of thousands of potential buyers and
              renters.
            </p>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <div className="font-semibold mb-2">
              🛠️ Property Management Tools
            </div>
            <p className="text-sm text-gray-600">
              Access tools to easily create and manage your property listings.
            </p>
          </div>

          <div className="border border-gray-200 rounded-md p-4">
            <div className="font-semibold mb-2">💼 Professional Profile</div>
            <p className="text-sm text-gray-600">
              Build your professional presence and connect with clients.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <h2 className="text-xl font-semibold mb-4">Agent Application Form</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Personal Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name*
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name*
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address*
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number*
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="e.g. +234 800 123 4567"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Bio / About Me
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows="4"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Tell potential clients about yourself and your experience..."
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">
                Professional Information
              </h3>

              <div className="mb-4">
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Years of Experience*
                </label>
                <select
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="0-1">Less than 1 year</option>
                  <option value="1-3">1-3 years</option>
                  <option value="3-5">3-5 years</option>
                  <option value="5-10">5-10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="licenseNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  License Number (if applicable)
                </label>
                <input
                  type="text"
                  id="licenseNumber"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="company"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Company (if applicable)
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Business Address*
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    City*
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="mb-4">
                  <label
                    htmlFor="state"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    State*
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Profile Image</h3>
            <div className="mb-2 text-sm text-gray-600">
              Upload a professional headshot that will be visible to potential
              clients.
            </div>
            <ImageUpload onChange={handleImageChange} maxImages={1} />
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="focus:ring-wine h-4 w-4 text-wine border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label
                  htmlFor="agreeToTerms"
                  className="font-medium text-gray-700"
                >
                  I agree to the{" "}
                  <a href="#" className="text-wine hover:underline">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-wine hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-wine text-white px-6 py-3 rounded-md flex items-center hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>
                  <FiSend className="mr-2" /> Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Protect this page with authentication
export const getServerSideProps = withAuth();

export default BecomeAgent;
