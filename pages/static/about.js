import Head from 'next/head';
import Image from 'next/image';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | TopDial</title>
        <meta name="description" content="Learn about TopDial, Nigeria's premier real estate platform connecting property seekers with verified listings." />
      </Head>
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">About TopDial</h1>
          
          <div className="mb-12 relative h-80 w-full">
            <Image
              src="/images/about-hero.jpg"
              alt="TopDial Team"
              fill
              className="object-cover rounded-lg"
            />
          </div>
          
          <div className="prose prose-lg max-w-none">
            <h2>Our Mission</h2>
            <p>
              At TopDial, we're committed to transforming the real estate experience in Nigeria. 
              Our mission is to create a transparent, efficient, and trustworthy platform that 
              connects property seekers with verified listings and professional agents.
            </p>
            
            <h2>Our Story</h2>
            <p>
              Founded in 2023, TopDial emerged from a simple observation: finding reliable property 
              information in Nigeria was unnecessarily complicated. Our founders experienced firsthand 
              the challenges of navigating the real estate market - from misleading listings to 
              unreliable agents.
            </p>
            
            <p>
              This experience inspired the creation of TopDial - a platform built on transparency, 
              verification, and user empowerment. We started with a small team passionate about 
              technology and real estate, and have grown into a trusted marketplace for property 
              transactions across Nigeria.
            </p>
            
            <h2>What Sets Us Apart</h2>
            <ul>
              <li>
                <strong>Verified Listings:</strong> Every property on TopDial goes through a 
                verification process to ensure accuracy and legitimacy.
              </li>
              <li>
                <strong>Professional Agents:</strong> We vet all agents on our platform to maintain 
                high standards of service and professionalism.
              </li>
              <li>
                <strong>User-Centered Design:</strong> Our platform is designed with the user experience 
                in mind, making property search intuitive and enjoyable.
              </li>
              <li>
                <strong>Community Focus:</strong> We're building more than a marketplace - we're creating 
                a community of property seekers, owners, and professionals.
              </li>
            </ul>
            
            <h2>Our Vision</h2>
            <p>
              We envision a future where every Nigerian has access to reliable real estate information 
              and services. Whether you're looking to buy your first home, invest in property, or find 
              the perfect rental, TopDial aims to be your trusted partner throughout the journey.
            </p>
            
            <h2>Join Us</h2>
            <p>
              Whether you're a property seeker, owner, or real estate professional, we invite you to 
              join the TopDial community. Together, we're building a better real estate experience 
              for Nigeria.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
