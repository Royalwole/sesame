import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../../contexts/AuthContext"; // Import our auth context
import { FiUser, FiChevronDown } from "react-icons/fi";

// Company and site information
const COMPANY_INFO = {
  name: "Topdial.ng",
  slogan: "building communities",
  phone: "123-456-7890",
  email: "info@topdial.ng",
};

const NAVIGATION = {
  main: [
    { name: "Home", path: "/" },
    { name: "Listings", path: "/listings" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ],
};

const SOCIAL_LINKS = {
  facebook: "https://facebook.com/topdial",
  instagram: "https://instagram.com/topdial",
};

// SearchBar component for property search
const SearchBar = ({ onSearch, showAdvanced, className = "" }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex items-center ${className}`}>
      <input
        type="text"
        placeholder="Search properties..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring focus:border-blue-300"
      />
      <button
        type="submit"
        className="bg-wine text-white p-2 rounded-r-md hover:bg-wine-dark"
      >
        <FaSearch />
      </button>
      {showAdvanced && (
        <button
          type="button"
          className="ml-2 text-sm text-gray-600 hover:text-gray-800"
        >
          Advanced
        </button>
      )}
    </form>
  );
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuth, user, dbUser, signOut, isLoading } = useAuth(); // Use our AuthContext instead of Clerk directly
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const handleSearch = (query) => {
    console.log("Searching for:", query);
    // Here you would typically trigger a navigation to search results
    // router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Handle sign out with error handling
  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/"; // Redirect to home page after sign out
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Handle explicit sign in (force new sign in)
  const handleSignIn = () => {
    window.location.href = "/auth/sign-in?force=true";
  };

  return (
    <header className="w-full">
      {/* Top Bar with contact info and social links */}
      <div className="bg-wine text-white py-2 hidden md:block">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <a
              href={`tel:${COMPANY_INFO.phone}`}
              className="text-sm hover:text-gray-200"
            >
              <span className="mr-2">📞</span> {COMPANY_INFO.phone}
            </a>
            <a
              href={`mailto:${COMPANY_INFO.email}`}
              className="text-sm hover:text-gray-200"
            >
              <span className="mr-2">✉️</span> {COMPANY_INFO.email}
            </a>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-gray-200"
            >
              Facebook
            </a>
            <a
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-gray-200"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:space-x-8">
            {/* Logo */}
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 relative">
                  <Image
                    src="/logo.png"
                    alt={COMPANY_INFO.name}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-wine">
                    {COMPANY_INFO.name}
                  </h1>
                  <p className="text-xs text-gray-600">{COMPANY_INFO.slogan}</p>
                </div>
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="md:hidden text-gray-700 hover:text-wine"
                onClick={toggleMenu}
                aria-label="Toggle menu"
              >
                {isMenuOpen ? (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Desktop Search and Navigation */}
            <div className="hidden md:flex flex-1 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-4">
                <SearchBar onSearch={handleSearch} showAdvanced={true} />
              </div>

              {/* Navigation Links */}
              <div className="flex items-center space-x-4">
                {NAVIGATION.main.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="text-gray-700 hover:text-wine transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Use conditional rendering based on auth state */}
                {isLoading ? (
                  // Loading state
                  <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
                ) : isAuth ? (
                  // Authenticated - fix the dropdown behavior
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={toggleUserDropdown}
                      className="flex items-center space-x-2 text-gray-700 hover:text-wine"
                    >
                      <span>{dbUser?.firstName || "User"}</span>
                      <FiChevronDown
                        className={`transition-transform ${
                          userDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Not authenticated
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleSignIn}
                      className="text-wine hover:text-wine-dark"
                    >
                      Sign In
                    </button>
                    <Link
                      href="/auth/sign-up"
                      className="bg-wine hover:bg-wine-dark text-white px-4 py-2 rounded"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-4">
              {/* Mobile Search */}
              <div className="mb-4">
                <SearchBar
                  onSearch={handleSearch}
                  showAdvanced={true}
                  className="w-full"
                />
              </div>

              {/* Mobile Navigation Links */}
              {NAVIGATION.main.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="block text-gray-700 hover:text-wine py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Use conditional rendering based on auth state for mobile */}
              {isLoading ? (
                <div className="h-8 w-full bg-gray-200 animate-pulse rounded"></div>
              ) : isAuth ? (
                <>
                  <div className="border-t pt-2 pb-1 border-gray-200">
                    <p className="text-gray-500 text-sm">Signed in as:</p>
                    <p className="font-medium">
                      {dbUser?.firstName || "User"} {dbUser?.lastName || ""}
                    </p>
                  </div>
                  <Link
                    href="/dashboard"
                    className="block text-gray-700 hover:text-wine py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    className="w-full text-left text-wine hover:text-wine-dark py-2"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="space-y-2">
                  <button
                    className="block text-wine hover:text-wine-dark py-2"
                    onClick={() => {
                      handleSignIn();
                      setIsMenuOpen(false);
                    }}
                  >
                    Sign In
                  </button>
                  <Link
                    href="/auth/sign-up"
                    className="block text-center bg-wine hover:bg-wine-dark text-white px-4 py-2 rounded"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Contact Info */}
              <div className="pt-4 border-t border-gray-200">
                <a
                  href={`tel:${COMPANY_INFO.phone}`}
                  className="block text-gray-600 py-2"
                >
                  <span className="mr-2">📞</span> {COMPANY_INFO.phone}
                </a>
                <a
                  href={`mailto:${COMPANY_INFO.email}`}
                  className="block text-gray-600 py-2"
                >
                  <span className="mr-2">✉️</span> {COMPANY_INFO.email}
                </a>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
