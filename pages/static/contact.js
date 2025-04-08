import { useState } from "react";
import Head from "next/head";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { FiMapPin, FiMail, FiPhone } from "react-icons/fi";
import { validateForm, ValidationSchemas } from "../../lib/validation";
import toast from "react-hot-toast"; // Add missing toast import

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState({
    success: false,
    message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult({ success: false, message: "" });

    // Validate form data
    const { errors, isValid } = validateForm(
      formData,
      ValidationSchemas.contact
    );

    if (!isValid) {
      setFormErrors(errors);
      toast.error("Please fix the errors in the form");
      setIsSubmitting(false);
      return;
    }

    try {
      // API call to send contact form
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      setSubmitResult({
        success: true,
        message: "Thank you for your message! We will get back to you soon.",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error sending contact form:", error);
      setSubmitResult({
        success: false,
        message: error.message || "Failed to send message. Please try again.",
      });
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Contact Us | TopDial</title>
        <meta
          name="description"
          content="Get in touch with the TopDial team for inquiries about our real estate platform."
        />
      </Head>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Contact Us
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">Get In Touch</h2>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiMapPin className="h-6 w-6 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-md font-medium text-gray-900">
                        Our Office
                      </h3>
                      <p className="text-gray-600">
                        123 Victoria Island
                        <br />
                        Lagos, Nigeria
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiMail className="h-6 w-6 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-md font-medium text-gray-900">
                        Email
                      </h3>
                      <p className="text-gray-600">info@topdial.ng</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiPhone className="h-6 w-6 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-md font-medium text-gray-900">
                        Phone
                      </h3>
                      <p className="text-gray-600">+234 123 456 7890</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    Working Hours
                  </h3>
                  <p className="text-gray-600">
                    Monday - Friday: 9am - 5pm
                    <br />
                    Saturday: 10am - 2pm
                    <br />
                    Sunday: Closed
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-6">
                  Send Us a Message
                </h2>

                {submitResult.message && (
                  <div
                    className={`mb-6 p-4 rounded-md ${
                      submitResult.success
                        ? "bg-green-50 text-green-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {submitResult.message}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                    <Input
                      label="Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />

                    <div className="md:col-span-2">
                      <Input
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Input
                        label="Message"
                        name="message"
                        as="textarea"
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Button
                      type="submit"
                      isLoading={isSubmitting}
                      disabled={isSubmitting}
                      size="lg"
                      className="w-full"
                    >
                      Send Message
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
