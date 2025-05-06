import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | TopDial</title>
        <meta name="description" content="TopDial Privacy Policy" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <div className="prose">
          <h2 className="text-xl font-semibold mt-6 mb-4">
            1. Information We Collect
          </h2>
          <p className="mb-4">
            We collect information that you provide directly to us when you
            create an account, use our services, or communicate with us.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">
            2. How We Use Your Information
          </h2>
          <p className="mb-4">
            We use the information we collect to provide, maintain, and improve
            our services, to communicate with you, and to protect our users.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">
            3. Information Sharing
          </h2>
          <p className="mb-4">
            We do not share your personal information with third parties except
            as described in this privacy policy.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">4. Data Security</h2>
          <p className="mb-4">
            We take reasonable measures to help protect your personal
            information from loss, theft, misuse, and unauthorized access.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">5. Your Rights</h2>
          <p className="mb-4">
            You have the right to access, update, or delete your personal
            information. Contact us to exercise these rights.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">
            6. Changes to This Policy
          </h2>
          <p className="mb-4">
            We may update this privacy policy from time to time. We will notify
            you of any changes by posting the new policy on this page.
          </p>
        </div>
      </div>
    </>
  );
}
