import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { UserButton, useUser } from "@clerk/nextjs";
import { useAuth } from "../../contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";
import {
  FiMenu,
  FiX,
  FiSearch,
  FiUser,
  FiList,
  FiInfo,
  FiPhone,
  FiChevronDown,
  FiChevronRight,
  FiLogIn,
  FiUserPlus,
  FiMapPin,
  FiHeart,
  FiHome,
  FiSettings,
} from "react-icons/fi";

export default function Header() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isAdmin, isAgent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const mobileMenuRef = useRef(null);
  const accountMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Handle scroll effect for header styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Handle body scroll locking when mobile menu or search is open
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [mobileMenuOpen, searchOpen]);

  // Reset menu state on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [router.asPath]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }

    if (accountMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [accountMenuOpen]);

  const isActive = (path) => {
    if (path === "/") {
      return router.pathname === "/";
    }
    return router.pathname.startsWith(path);
  };

  const navigationItems = [
    { name: "Home", path: "/", icon: <FiHome className="mr-3 h-5 w-5" aria-hidden="true" /> },
    { name: "Properties", path: "/listings", icon: <FiList className="mr-3 h-5 w-5" aria-hidden="true" /> },
    { name: "About", path: "/about", icon: <FiInfo className="mr-3 h-5 w-5" aria-hidden="true" /> },
    { name: "Contact", path: "/contact", icon: <FiPhone className="mr-3 h-5 w-5" aria-hidden="true" /> },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
        scrolled ? "bg-white shadow-lg py-3" : "bg-white py-5"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-8">
        <nav className="relative flex items-center justify-between">
          {/* Logo with gold accent */}
          <div className="flex-shrink-0 z-10">
            <Link href="/" className="flex items-center">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt="Topdial"
                  width={150}
                  height={52}
                  className={`transition-all duration-300 ${scrolled ? "scale-[0.87]" : ""}`}
                  priority
                />
                <div className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300"></div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:justify-center lg:space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 
                  ${isActive(item.path) ? "text-slate-900" : "text-slate-600 hover:text-slate-900"} uppercase tracking-wider`}
              >
                {item.name}
                {isActive(item.path) && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors flex items-center"
              aria-label="Search"
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Authentication */}
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="relative ml-3" ref={accountMenuRef}>
                    <div>
                      <button
                        onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                        className="flex items-center text-slate-700 hover:text-slate-900 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-sm font-medium gap-x-1 transition-all duration-200 border border-slate-100"
                        aria-expanded={accountMenuOpen}
                      >
                        <span className="font-medium">Dashboard</span>
                        <FiChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            accountMenuOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Account dropdown menu */}
                    {accountMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1 z-50 overflow-hidden border border-slate-100"
                        role="menu"
                      >
                        <div className="p-3 bg-slate-50 border-b border-slate-100">
                          <div className="flex items-center">
                            <UserButton afterSignOutUrl="/" />
                            <div className="ml-3">
                              <p className="text-xs text-slate-500">Logged in as</p>
                              <p className="text-sm font-medium text-slate-700">Account</p>
                            </div>
                          </div>
                        </div>

                        <div className="py-1">
                          {isAdmin && (
                            <Link
                              href="/dashboard/admin"
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              role="menuitem"
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          {isAgent && (
                            <Link
                              href="/dashboard/agent"
                              className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                              role="menuitem"
                            >
                              Agent Dashboard
                            </Link>
                          )}
                          <Link
                            href="/dashboard"
                            className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            role="menuitem"
                          >
                            <FiUser className="mr-2 h-4 w-4 text-slate-500" />
                            My Dashboard
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Link
                      href="/auth/sign-in"
                      className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-all duration-200"
                    >
                      <FiLogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-full transition-all duration-200"
                    >
                      <FiUserPlus className="mr-2 h-4 w-4" />
                      Register
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              id="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile menu - Slide-in panel */}
      <div
        id="mobile-menu"
        ref={mobileMenuRef}
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="Topdial" width={100} height={35} />
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors"
            aria-label="Close menu"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-1 pb-4">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? "bg-slate-50 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon}
                {item.name}
                {isActive(item.path) && (
                  <div className="ml-auto">
                    <FiChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </Link>
            ))}
          </div>

          {/* Authentication in mobile menu */}
          <div className="pt-4 border-t border-slate-100">
            <p className="px-3 text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Account</p>

            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="space-y-1">
                    <Link
                      href="/dashboard"
                      className="flex items-center py-3 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiUser className="mr-3 h-5 w-5" />
                      My Dashboard
                    </Link>

                    {isAgent && (
                      <Link
                        href="/dashboard/agent"
                        className="flex items-center py-3 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FiList className="mr-3 h-5 w-5" />
                        Agent Dashboard
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        className="flex items-center py-3 px-3 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <FiSettings className="mr-3 h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 p-3">
                    <Link
                      href="/auth/sign-in"
                      className="flex items-center justify-center w-full py-2.5 px-4 rounded-lg text-sm font-medium text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-900 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiLogIn className="mr-2 h-4 w-4" />
                      Sign in
                    </Link>
                    <Link
                      href="/auth/sign-up"
                      className="flex items-center justify-center w-full py-2.5 px-4 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition-all"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <FiUserPlus className="mr-2 h-4 w-4" />
                      Register
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </nav>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-white z-40 lg:hidden"
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Search Overlay */}
      {searchOpen && (
        <>
          <div
            className="fixed inset-0 bg-black z-50 p-4 flex items-start justify-center pt-[20vh]"
            onClick={() => setSearchOpen(false)}
          >
            <div
              className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 relative">
                <div className="flex items-center border-b border-slate-100 pb-4">
                  <FiSearch className="w-5 h-5 text-slate-400 mr-3" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search properties, locations..."
                    className="flex-1 bg-transparent border-0 focus:ring-0 text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick search links */}
                <div className="mt-4">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2">Popular searches</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <Link
                      href="/listings?listingType=sale&location=Lagos"
                      className="flex items-center px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-sm"
                      onClick={() => setSearchOpen(false)}
                    >
                      <FiMapPin className="mr-2 h-4 w-4 text-slate-500" />
                      Lagos properties
                    </Link>
                    <Link
                      href="/listings?listingType=rent"
                      className="flex items-center px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-sm"
                      onClick={() => setSearchOpen(false)}
                    >
                      <FiHome className="mr-2 h-4 w-4 text-slate-500" />
                      Rental homes
                    </Link>
                    <Link
                      href="/listings?category=luxury"
                      className="flex items-center px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-700 text-sm"
                      onClick={() => setSearchOpen(false)}
                    >
                      <FiHeart className="mr-2 h-4 w-4 text-slate-500" />
                      Luxury homes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
