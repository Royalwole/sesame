import Head from 'next/head';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | TopDial</title>
        <meta name="description" content="Learn how TopDial collects, uses, and protects your personal information." />
      </Head>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p>Last Updated: January 1, 2024</p>
            
            <h2>1. Introduction</h2>
            <p>
              At TopDial, we respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile application, or any related services (collectively, the "Platform").
            </p>
            
            <h2>2. Information We Collect</h2>
            <p>
              We may collect the following types of information:
            </p>
            <ul>
              <li>
                <strong>Personal Information:</strong> This includes your name, email address, phone number, and other information you provide when creating an account or using our services.
              </li>
              <li>
                <strong>Property Information:</strong> If you list a property, we collect details about that property, including address, features, and pricing.
              </li>
              <li>
                <strong>Usage Information:</strong> We collect information about how you use our Platform, including your search history, preferences, and interactions with listings.
              </li>
              <li>
                <strong>Device Information:</strong> This includes your IP address, browser type, operating system, and device identifiers.
              </li>
            </ul>
            
            <h2>3. How We Use Your Information</h2>
            <p>
              We may use the information we collect to:
            </p>
            <ul>
              <li>Provide, maintain, and improve our Platform</li>
              <li>Process and complete transactions</li>
              <li>Connect property seekers with agents and property owners</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities in connection with our Platform</li>
              <li>Detect, prevent, and address fraud and other illegal activities</li>
              <li>Personalize your experience on our Platform</li>
            </ul>
            
            <h2>4. Information Sharing and Disclosure</h2>
            <p>
              We may share your information in the following situations:
            </p>
            <ul>
              <li>
                <strong>With Other Users:</strong> If you are a property seeker, we may share your information with agents or property owners. If you are an agent or property owner, we may share your information with property seekers.
              </li>
              <li>
                <strong>With Service Providers:</strong> We may share information with third-party vendors, consultants, and other service providers who need access to such information to perform services for us.
              </li>
              <li>
                <strong>For Legal Reasons:</strong> We may disclose information if we believe in good faith that disclosure is necessary to comply with the law, protect our rights or safety, or the rights or safety of others.
              </li>
              <li>
                <strong>Business Transfers:</strong> If TopDial is involved in a merger, acquisition, or sale of all or a portion of its assets, your information may be transferred as part of that transaction.
              </li>
            </ul>
            
            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
            
            <h2>6. Your Choices</h2>
            <p>
              You may update, correct, or delete your account information at any time by logging into your account or contacting us. You may also opt out of receiving promotional communications from us by following the instructions in those communications.
            </p>
            
            <h2>7. Children's Privacy</h2>
            <p>
              Our Platform is not intended for children under the age of 18. We do not knowingly collect personal information from children under 18. If you are a parent or guardian and you believe your child has provided us with personal information, please contact us.
            </p>
            
            <h2>8. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            
            <h2>9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at privacy@topdial.ng.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
