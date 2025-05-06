import Head from "next/head";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service | TopDial</title>
        <meta name="description" content="TopDial Terms of Service" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
        <div className="prose">
          <h2 className="text-xl font-semibold mt-6 mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing and using TopDial, you accept and agree to be bound by
            the terms and provision of this agreement.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">2. Use License</h2>
          <p className="mb-4">
            Permission is granted to temporarily use this website for personal,
            non-commercial transitory viewing only.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">3. User Account</h2>
          <p className="mb-4">
            To access certain features of the website, you may be required to
            create an account. You are responsible for maintaining the
            confidentiality of your account information.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">
            4. Service Changes
          </h2>
          <p className="mb-4">
            TopDial reserves the right to modify or discontinue, temporarily or
            permanently, the service with or without notice.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-4">5. Contact</h2>
          <p className="mb-4">
            If you have any questions about these Terms, please contact us.
          </p>
        </div>
      </div>
    </>
  );
}
