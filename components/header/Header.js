import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { UserButton, useUser, SignInButton } from "@clerk/nextjs";
import { FiMenu, FiX, FiHome, FiSearch, FiUser } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext";

export default function Header() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isAgent, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const mobileMenuRef = useRef(null);
  const menuButtonRef = useRef(null);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  // Directly handle the mobile menu toggle without relying on global window function
  const toggleMobileMenu = () => {
    setIsMenuOpen((prevState) => !prevState);
  };

  // Navigation links - customize as needed
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Buy", href: "/listings?listingType=sale" },
    { name: "Rent", href: "/listings?listingType=rent" },
    { name: "Agents", href: "/agents" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  // Debug user auth state
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Auth state in header:", { isLoaded, isSignedIn });
    }
  }, [isLoaded, isSignedIn]);

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
                  width={140}
                  height={40}
                  className="h-10 w-auto"
                />
              </div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 ${
                  router.pathname === link.href
                    ? "border-wine text-wine"
                    : "border-transparent text-gray-600 hover:text-wine hover:border-gray-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth buttons for desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {isLoaded && isSignedIn ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={
                    isAdmin
                      ? "/dashboard/admin"
                      : isAgent
                        ? "/dashboard/agent"
                        : "/dashboard"
                  }
                  className="text-gray-600 hover:text-wine flex items-center space-x-1"
                >
                  <FiUser className="mr-1" />
                  <span>Dashboard</span>
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  className="text-gray-600 hover:text-wine"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="bg-wine text-white px-4 py-2 rounded hover:bg-opacity-90"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              ref={menuButtonRef}
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-wine hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-wine"
              aria-expanded={isMenuOpen}
            >
              <span className="sr-only">
                {isMenuOpen ? "Close menu" : "Open menu"}
              </span>
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={mobileMenuRef}
        className={`lg:hidden ${isMenuOpen ? "block" : "hidden"}`}
      >
        <div className="pt-2 pb-3 space-y-1 border-t">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block pl-3 pr-4 py-2 text-base font-medium ${
                router.pathname === link.href
                  ? "bg-wine/10 text-wine border-l-4 border-wine"
                  : "text-gray-600 hover:bg-gray-50 hover:text-wine"
              }`}
              onClick={toggleMobileMenu}
            >
              {link.name}
            </Link>
          ))}

          {/* Auth links for mobile */}
          {isLoaded && isSignedIn ? (
            <Link
              href={
                isAdmin
                  ? "/dashboard/admin"
                  : isAgent
                    ? "/dashboard/agent"
                    : "/dashboard"
              }
              className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-wine"
              onClick={toggleMobileMenu}
            >
              <div className="flex items-center">
                <FiUser className="mr-2" /> Dashboard
              </div>
            </Link>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-wine"
                onClick={toggleMobileMenu}
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="block pl-3 pr-4 py-2 text-base font-medium bg-gray-50 text-wine hover:bg-gray-100"
                onClick={toggleMobileMenu}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
