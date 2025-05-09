import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs"; // Removed UserButton import
import { BsHouseDoor, BsBuilding, BsMap } from "react-icons/bs";
import { FiSearch } from "react-icons/fi";
import AuthDebugger from "../components/utils/AuthDebugger";

// Make the font optional to prevent build failures when Google Fonts is unreachable
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  optional: true, // Add this line to make the font optional
});

export default function Home() {
  // Restoring original featured property images
  const featuredImages = [
    "https://www.resolutionlawng.com/wp-content/uploads/2020/09/house-in-Nigeria-image-1.jpeg",
    "https://naijalandlord.com/wp-content/uploads/2024/12/IMG-20241217-WA0933-1170x785.jpg",
    "https://images.adsttc.com/media/images/642d/94aa/aa1b/8007/8c6a/da64/slideshow/the-lantern-house-cmdesign-atelier_6.jpg?1680708817",
  ];

  // Property categories with original images
  const categories = [
    {
      title: "Residential",
      description:
        "Find your dream home, from luxury apartments to family houses.",
      image: featuredImages[0],
      icon: <BsHouseDoor className="text-wine text-xl mr-2" />,
      link: "/listings?type=residential",
    },
    {
      title: "Commercial",
      description:
        "Office spaces, retail locations, and other business properties.",
      image: featuredImages[1],
      icon: <BsBuilding className="text-wine text-xl mr-2" />,
      link: "/listings?type=commercial",
    },
    {
      title: "Land",
      description: "Investment opportunities in prime land across Nigeria.",
      image: featuredImages[2],
      icon: <BsMap className="text-wine text-xl mr-2" />,
      link: "/listings?type=land",
    },
  ];

  return (
    <>
      <main className="min-h-screen pt-16">
        {/* Hero Section */}
        <section className="relative h-[600px] flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src={featuredImages[0]}
              alt="Modern real estate in Nigeria"
              fill
              priority
              sizes="100vw"
              className="object-cover brightness-[0.7]"
            />
          </div>

          <div className="container mx-auto px-4 z-10 relative">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Find Your Perfect Property in Nigeria
              </h1>
              <p className="text-xl text-gray-200 mb-8">
                Topdial.ng connects you with the best properties across Nigeria.
                Buy, rent, or lease with confidence.
              </p>

              {/* Search Box */}
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <form className="flex flex-wrap gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <select className="w-full p-3 border rounded-md">
                      <option value="">Property Type</option>
                      <option value="apartment">Apartment</option>
                      <option value="house">House</option>
                      <option value="land">Land</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <select className="w-full p-3 border rounded-md">
                      <option value="">Location</option>
                      <option value="lagos">Lagos</option>
                      <option value="abuja">Abuja</option>
                      <option value="port-harcourt">Port Harcourt</option>
                      <option value="ibadan">Ibadan</option>
                    </select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <select className="w-full p-3 border rounded-md">
                      <option value="">Price Range</option>
                      <option value="0-1000000">₦0 - ₦1M</option>
                      <option value="1000000-5000000">₦1M - ₦5M</option>
                      <option value="5000000-20000000">₦5M - ₦20M</option>
                      <option value="20000000-100000000">₦20M - ₦100M</option>
                      <option value="100000000+">₦100M+</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-wine hover:bg-opacity-90 text-white px-6 py-3 rounded-md flex items-center justify-center min-w-[120px]"
                  >
                    <FiSearch className="mr-2" />
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Property Categories */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Browse by Property Type
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {categories.map((category, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105"
                >
                  <div className="h-48 relative">
                    <Image
                      src={category.image}
                      alt={`${category.title} Properties`}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center mb-3">
                      {category.icon}
                      <h3 className="text-xl font-semibold">
                        {category.title}
                      </h3>
                    </div>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <Link
                      href={category.link}
                      className="text-wine font-medium hover:underline"
                    >
                      View Properties →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Listings */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-bold">Featured Properties</h2>
              <Link
                href="/listings"
                className="text-wine font-medium hover:underline"
              >
                View All Properties →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredImages.map((image, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="h-60 relative">
                    <Image
                      src={image}
                      alt={`Featured property ${idx + 1}`}
                      fill
                      sizes="100vw"
                      className="object-cover"
                    />
                    <div className="absolute top-0 right-0 bg-wine text-white px-3 py-1 m-4 rounded">
                      For Sale
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">
                      Luxury{" "}
                      {idx === 0 ? "Apartment" : idx === 1 ? "House" : "Villa"}{" "}
                      in Nigeria
                    </h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 mr-1"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      <span>
                        {idx === 0
                          ? "Lagos"
                          : idx === 1
                            ? "Abuja"
                            : "Port Harcourt"}
                        , Nigeria
                      </span>
                    </div>
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-600 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                          />
                        </svg>
                        <span>{idx + 2} Beds</span>
                      </div>
                      <div className="flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-600 mr-1"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          ₦{(35000000 + idx * 10000000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/listings/${idx + 1}`}
                      className="block w-full bg-wine hover:bg-opacity-90 text-white text-center py-3 rounded-md"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Choose Topdial.ng
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-red-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-wine"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  Verified Properties
                </h3>
                <p className="text-gray-600">
                  All our listings are verified by our team to ensure legitimacy
                  and quality.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-red-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-wine"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Expert Agents</h3>
                <p className="text-gray-600">
                  Our network of professional agents provides personalized
                  guidance.
                </p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="bg-red-50 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-8 h-8 text-wine"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Market Insights</h3>
                <p className="text-gray-600">
                  Get access to real-time market trends and property valuations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-wine text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to find your dream property?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Whether you're looking to buy, rent, or invest, Topdial.ng has the
              perfect property for you.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/listings"
                className="bg-white text-wine px-8 py-3 rounded-md font-medium hover:bg-gray-100"
              >
                Browse Properties
              </Link>
              <SignedOut>
                <Link
                  href="/auth/sign-up"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-wine"
                >
                  Sign Up Now
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-md font-medium hover:bg-white hover:text-wine"
                >
                  Go to Dashboard
                </Link>
              </SignedIn>
            </div>
          </div>
        </section>
      </main>
      {/* Add auth debugger in development */}
      <AuthDebugger />
    </>
  );
}

// If you need static generation (builds HTML at build time):
export async function getStaticProps() {
  // Your static props logic here
  return {
    props: {
      // Your props here
    },
    // Optional: revalidate every X seconds for ISR
    revalidate: 60,
  };
}
