import { FiMapPin, FiCalendar, FiUsers, FiAward, FiHome } from "react-icons/fi";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main
      title="About Us"
      description="Learn about TopDial Real Estate, our mission, our team, and how we're transforming the real estate market."
      heroImage="/images/about-hero.jpg"
      heroTitle="About TopDial"
      heroSubtitle="Transforming how people find their perfect home"
    >
      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              At TopDial, we're committed to transforming the real estate
              experience. Our mission is to create a transparent, efficient, and
              trustworthy platform that connects property seekers with verified
              listings and reputable agents. We leverage technology to simplify
              the property search process while maintaining the human connection
              that is essential to finding the perfect home.
            </p>
          </div>

          {/* Key Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 mx-auto bg-wine-light rounded-full flex items-center justify-center mb-4">
                <FiHome className="h-8 w-8 text-wine" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Listings</h3>
              <p className="text-gray-600">
                Every property on our platform is verified and thoroughly
                checked to ensure accuracy and quality.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <FiUsers className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trusted Agents</h3>
              <p className="text-gray-600">
                We partner with professional, vetted agents who are committed to
                providing exceptional service.
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg shadow-sm text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <FiAward className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Customer First</h3>
              <p className="text-gray-600">
                We prioritize your needs and preferences to help you find the
                perfect property with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0 md:pr-10">
                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                <p className="text-gray-700 mb-6">
                  TopDial was founded in 2020 by a team of real estate
                  professionals and technology experts who recognized the need
                  for a more transparent and efficient property marketplace.
                </p>
                <p className="text-gray-700 mb-6">
                  What started as a small venture with just a handful of
                  listings has grown into a comprehensive platform serving
                  thousands of users across the country, helping them find their
                  dream homes and make informed real estate decisions.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiCalendar className="h-5 w-5 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium">2020</h4>
                      <p className="text-gray-600">
                        TopDial founded with a mission to transform real estate
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiCalendar className="h-5 w-5 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium">2021</h4>
                      <p className="text-gray-600">
                        Expanded to serve three major cities with 500+ listings
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiCalendar className="h-5 w-5 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium">2022</h4>
                      <p className="text-gray-600">
                        Launched agent verification program and mobile app
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <FiCalendar className="h-5 w-5 text-wine" />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-lg font-medium">2023</h4>
                      <p className="text-gray-600">
                        Nationwide expansion with AI-powered property matching
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="relative h-80 md:h-96 overflow-hidden rounded-lg shadow-lg">
                  <Image
                    src="/images/team-photo.jpg"
                    alt="TopDial Team"
                    className="object-cover"
                    fill
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Leadership Team</h2>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Meet the dedicated professionals who are working to revolutionize
              the real estate experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Olawale Akinola",
                position: "Chief Executive Officer",
                image: "/images/team/ceo.jpg",
                bio: "With 15 years in real estate and tech, Olawale leads our vision and strategy.",
              },
              {
                name: "Kolawole Joseph",
                position: "Chief Technology Officer",
                image: "/images/team/cto.jpg",
                bio: "Joseph brings 10+ years of experience building innovative tech platforms.",
              },
              {
                name: "David Oladele",
                position: "Head of Operations",
                image: "/images/team/operations.jpg",
                bio: "David ensures that our platform runs smoothly for all users.",
              },
              {
                name: "Olawale Adebayo",
                position: "Head of Agent Relations",
                image: "/images/team/agent-relations.jpg",
                bio: "Olawale works directly with our network of trusted real estate agents.",
              },
            ].map((member, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg overflow-hidden shadow-sm"
              >
                <div className="relative h-64">
                  <Image
                    src={member.image}
                    alt={member.name}
                    className="object-cover"
                    fill
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/placeholder-avatar.png";
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-blue-600 mb-2">{member.position}</p>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-wine text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Perfect Property?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users who have found their dream homes
            through TopDial.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/listings"
              className="px-6 py-3 bg-white text-wine font-medium rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-wine"
            >
              Browse Listings
            </a>
            <a
              href="/contact"
              className="px-6 py-3 bg-transparent text-white border border-white font-medium rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
