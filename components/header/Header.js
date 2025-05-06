import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { FiMenu, FiX, FiHome, FiSearch, FiUser } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const { isAgent, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Navigation links - customize as needed
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Buy", href: "/listings?listingType=sale" },
    { name: "Rent", href: "/listings?listingType=rent" },
    { name: "Agents", href: "/agents" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-30 w-full transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-white/90 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt="Topdial.ng"
                  width={120}
                  height={38}
                />
                <div className="absolute -bottom-1 left-0 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300"></div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 border-b-2 ${
                  router.pathname === link.href ||
                  (link.href !== "/" && router.pathname.startsWith(link.href))
                    ? "border-wine text-wine"
                    : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Search button */}
            <button
              onClick={() => router.push("/search")}
              className="p-1 rounded-full text-gray-500 hover:text-wine hover:bg-gray-100 focus:outline-none"
            >
              <FiSearch className="h-5 w-5" />
            </button>

            {/* Auth/Dashboard buttons */}
            <div className="hidden md:flex items-center space-x-2">
              {isSignedIn ? (
                <>
                  {/* Dashboard link - show appropriate dashboard based on role */}
                  <Link
                    href={
                      isAdmin
                        ? "/dashboard/admin"
                        : isAgent
                          ? "/dashboard/agent"
                          : "/dashboard"
                    }
                    className="text-gray-500 hover:text-wine px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  {/* User button dropdown */}
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    className="text-gray-700 hover:text-wine px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    className="bg-wine text-white hover:bg-wine/90 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-wine hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <FiX className="h-6 w-6" />
                ) : (
                  <FiMenu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="pt-2 pb-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`block pl-3 pr-4 py-2 text-base font-medium ${
                  router.pathname === link.href
                    ? "bg-wine/10 text-wine border-l-4 border-wine"
                    : "text-gray-600 hover:bg-gray-50 hover:text-wine"
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {/* Auth links for mobile */}
            {isSignedIn ? (
              <Link
                href={
                  isAdmin
                    ? "/dashboard/admin"
                    : isAgent
                      ? "/dashboard/agent"
                      : "/dashboard"
                }
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-wine"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center">
                  <FiUser className="mr-2" /> Dashboard
                </div>
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-wine"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="block pl-3 pr-4 py-2 text-base font-medium bg-gray-50 text-wine hover:bg-gray-100"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
