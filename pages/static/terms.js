import Head from 'next/head';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service | TopDial</title>
        <meta name="description" content="TopDial's terms of service and conditions for using our real estate platform." />
      </Head>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p>Last Updated: January 1, 2024</p>
            
            <h2>1. Acceptance of Terms</h2>
            <p>
              Welcome to TopDial. By accessing or using our website, mobile application, or any related services (collectively, the "Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our Platform.
            </p>
            
            <h2>2. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of any significant changes by posting the updated Terms on our Platform. Your continued use of the Platform after any such changes constitutes your acceptance of the new Terms.
            </p>
            
            <h2>3. User Accounts</h2>
            <p>
              To access certain features of the Platform, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate and complete information when creating your account and to update such information as necessary.
            </p>
            
            <h2>4. User Conduct</h2>
            <p>
              When using our Platform, you agree not to:
            </p>
            <ul>
              <li>Violate any applicable law or regulation</li>
              <li>Infringe upon the rights of others</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Use the Platform for unauthorized commercial purposes</li>
              <li>Interfere with or disrupt the Platform or its servers</li>
              <li>Attempt to gain unauthorized access to any part of the Platform</li>
              <li>Harass, intimidate, or threaten other users</li>
            </ul>
            
            <h2>5. Property Listings</h2>
            <p>
              Agents and property owners who post listings on our Platform are responsible for ensuring that all information provided is accurate, complete, and up-to-date. TopDial reserves the right to remove any listing that violates these Terms or that we believe, in our sole discretion, is inappropriate for the Platform.
            </p>
            
            <h2>6. Intellectual Property</h2>
            <p>
              The Platform and its original content, features, and functionality are owned by TopDial and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our Platform without our prior written consent.
            </p>
            
            <h2>7. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, TopDial shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use of the Platform.
            </p>
            
            <h2>8. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Nigeria, without regard to its conflict of law provisions.
            </p>
            
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at info@topdial.ng.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
