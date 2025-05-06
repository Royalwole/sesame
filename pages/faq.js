import Head from "next/head";
import { useState } from "react";

function FAQItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        className="w-full py-5 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-medium text-gray-900">{question}</span>
          <span className="ml-6">
            <svg
              className={`w-6 h-6 transform ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="pb-5">
          <p className="text-gray-600">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const faqs = [
    {
      question: "How do I list my property on TopDial?",
      answer:
        "To list your property, sign up for an account and navigate to the dashboard. Click on 'Add New Listing' and fill out the required information about your property, including photos, price, and description. Once submitted, our team will review your listing before it goes live.",
    },
    {
      question: "What types of properties can I find on TopDial?",
      answer:
        "TopDial features a wide range of properties including residential homes, apartments, commercial spaces, and land. You can find both properties for sale and for rent across various locations in Nigeria.",
    },
    {
      question: "How do I schedule a property viewing?",
      answer:
        "When you find a property you're interested in, click the 'Schedule Viewing' button on the listing page. You can choose your preferred date and time, and our team will coordinate with the property owner or agent to confirm your appointment.",
    },
    {
      question: "Is my information secure on TopDial?",
      answer:
        "Yes, we take data security seriously. All personal information is encrypted and stored securely. We never share your information with third parties without your consent. You can review our Privacy Policy for more details.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "We accept various payment methods including bank transfers, credit/debit cards, and other secure online payment options. All transactions are processed through secure payment gateways.",
    },
    {
      question: "How can I contact a property owner or agent?",
      answer:
        "Each listing includes a contact button that allows you to send a message directly to the property owner or agent through our platform. You can also save listings to your favorites and manage your communications through your dashboard.",
    },
    {
      question: "What if I find an issue with a listing?",
      answer:
        "If you notice any issues with a listing or suspect fraudulent activity, please use the 'Report Listing' feature or contact our support team immediately. We investigate all reports to maintain the quality and authenticity of our listings.",
    },
  ];

  return (
    <>
      <Head>
        <title>Frequently Asked Questions | TopDial</title>
        <meta
          name="description"
          content="Find answers to common questions about using TopDial, Nigeria's premier real estate platform."
        />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FAQItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Can't find what you're looking for?{" "}
            <a
              href="/contact"
              className="text-wine hover:text-wine-dark font-medium"
            >
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
