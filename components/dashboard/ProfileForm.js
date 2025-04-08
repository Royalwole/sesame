import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { validateForm, ValidationSchemas } from "../../lib/validation";

export default function ProfileForm({ user, onUpdate }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    bio: user?.bio || "",
    address: user?.address || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is modified
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate using our validation library
    const { errors, isValid } = validateForm(formData, ValidationSchemas.user);

    if (!isValid) {
      setFormErrors(errors);
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error (${response.status})`);
      }

      const data = await response.json();

      toast.success("Profile updated successfully");

      // Call the parent component's update function if provided
      if (onUpdate) {
        onUpdate(data.data.user);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        error={formErrors.name}
      />

      <Input
        label="Phone"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        placeholder="e.g., +234 XXX XXX XXXX"
        error={formErrors.phone}
      />

      <Input
        label="Bio"
        name="bio"
        as="textarea"
        rows={4}
        value={formData.bio}
        onChange={handleChange}
        placeholder="Tell us about yourself..."
        error={formErrors.bio}
      />

      <Input
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        placeholder="Your address"
        error={formErrors.address}
      />

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
          Update Profile
        </Button>
      </div>
    </form>
  );
}
