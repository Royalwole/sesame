import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { UserButton, useUser } from "@clerk/nextjs";
import { useAuth } from "../../contexts/AuthContext";
import Image from "next/image";
import {
  FiMenu,
  FiX,
  FiHome,
  FiUser,
  FiList,
  FiInfo,
  FiPhone,
  FiChevronDown,
  FiChevronRight,
  FiSearch,
  FiLogIn,
  FiUserPlus,
  FiMapPin,
  FiHeart,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useHydration } from "../../lib/useHydration"; // Import the useHydration hook

export default function Header() {
  const isHydrated = useHydration(); // Add this to track hydration state
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isAdmin, isAgent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navRef = useRef(null);
  const accountMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    // Only run on the client side
    if (!isHydrated) return;

    function handleClickOutside(event) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountMenuOpen(false);
      }
      if (mobileMenuOpen && navRef.current && !navRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileMenuOpen, isHydrated]);

  // Focus search input when search opens
  useEffect(() => {
    // Only run on the client side
    if (!isHydrated) return;

    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen, isHydrated]);

  // Handle scroll behavior
  useEffect(() => {
    // Only run on the client side
    if (!isHydrated) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check for page load position
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHydrated]);

  // Close mobile menu on route change
  useEffect(() => {
    if (!isHydrated) return;

    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [router.asPath, isHydrated]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    // Only run on the client side
    if (!isHydrated) return;

    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, searchOpen, isHydrated]);

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

  // Define animations
  const menuVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const searchOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: "100%", transition: { duration: 0.3 } }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${
          scrolled 
            ? "bg-white/95 backdrop-blur-md shadow-lg py-3" 
            : "bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-sm py-5"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-8">
          <nav ref={navRef} className="relative flex items-center justify-between">
            {/* Logo with gold accent */}
            <div className="flex-shrink-0 z-10">
              <Link href="/" className="flex items-center">
                <div className="relative">
                  <Image
                    src="/logo.svg"
                    alt="Topdial"
                    width={scrolled ? 130 : 150}
                    height={scrolled ? 45 : 52}
                    className="transition-all duration-300"
                  />
                  <div className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300"></div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Elegant centered design */}
            <div className="hidden lg:flex lg:items-center lg:justify-center lg:space-x-8">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`relative px-3 py-2 text-sm font-medium transition-all duration-200 
                    ${isActive(item.path)
                      ? "text-slate-900"
                      : "text-slate-600 hover:text-slate-900"
                    } uppercase tracking-wider`}
                >
                  {item.name}
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300" />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Right Actions - Refined and minimal */}
            <div className="hidden md:flex md:items-center md:space-x-4">
              {/* Premium search button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors flex items-center"
                aria-label="Search"
              >
                <FiSearch className="w-5 h-5" />
              </button>

              {/* Authentication - Elegant implementation */}
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

                      <AnimatePresence>
                        {accountMenuOpen && (
                          <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={menuVariants}
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
                              <Link
                                href="/dashboard/profile"
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                role="menuitem"
                              >
                                Profile Settings
                              </Link>
                              <Link
                                href="/listings?favorites=true"
                                className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                role="menuitem"
                              >
                                <FiHeart className="mr-2 h-4 w-4 text-slate-500" />
                                Saved Properties
                              </Link>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link
                        href="/auth/sign-in"
                        className="hidden sm:flex px-5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-full text-sm font-medium transition-all duration-200"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/sign-up"
                        className="hidden sm:flex items-center px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:shadow-md hover:from-amber-600 hover:to-amber-500 rounded-full text-sm font-medium transition-all duration-200"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Buttons - Clean and minimal */}
            <div className="flex items-center lg:hidden">
              {/* Mobile Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-full text-slate-500 hover:text-slate-700 bg-slate-50/80 mr-1"
                aria-label="Search"
              >
                <FiSearch className="w-5 h-5" />
              </button>

              {/* Mobile Nav Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-full text-slate-500 hover:text-slate-700 bg-slate-50/80"
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? (
                  <FiX className="w-5 h-5" />
                ) : (
                  <FiMenu className="w-5 h-5" />
                )}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay - Luxurious slide-in effect */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
              aria-hidden="true"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileMenuVariants}
              className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl z-40 overflow-y-auto"
              id="mobile-menu"
            >
              <div className="p-5 flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <Link
                    href="/"
                    className="flex items-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="relative">
                      <Image src="/logo.png" alt="TopDial" width={120} height={38} />
                      <div className="absolute -bottom-1 left-0 w-10 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300"></div>
                    </div>
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-full text-slate-500 hover:text-slate-700 bg-slate-50"
                    aria-label="Close menu"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <nav className="mt-6 flex-grow">
                  <ul className="space-y-1">
                    {navigationItems.map((item) => (
                      <li key={item.name}>
                        <Link
                          href={item.path}
                          className={`flex items-center px-4 py-3 text-base font-medium rounded-lg ${
                            isActive(item.path)
                              ? "bg-amber-50 text-amber-700"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {item.icon}
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-6 pt-6 border-t border-slate-100">
                    <h3 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Popular Locations
                    </h3>
                    <div className="mt-3 space-y-1">
                      {["Lagos", "Abuja", "Port Harcourt", "Ibadan"].map((location) => (
                        <Link
                          key={location}
                          href={`/listings?location=${location}`}
                          className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
                        >
                          <FiMapPin className="mr-3 h-4 w-4 text-amber-500" />
                          {location}
                        </Link>
                      ))}
                    </div>
                  </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-slate-100">
                  {isLoaded && (
                    <>
                      {isSignedIn ? (
                        <div className="space-y-3">
                          <div className="px-4 py-3 bg-slate-50 rounded-lg flex items-center">
                            <UserButton />
                            <span className="ml-3 text-sm font-medium text-slate-700">My Account</span>
                          </div>
                          <nav className="mt-2 space-y-1">
                            <Link
                              href="/dashboard"
                              className="flex items-center px-4 py-3 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                            >
                              <FiUser className="mr-3 h-5 w-5 text-amber-500" aria-hidden="true" />
                              Dashboard
                            </Link>

                            {isAdmin && (
                              <Link
                                href="/dashboard/admin"
                                className="flex items-center px-4 py-3 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                              >
                                <FiUser className="mr-3 h-5 w-5 text-amber-500" aria-hidden="true" />
                                Admin Dashboard
                              </Link>
                            )}

                            {isAgent && (
                              <Link
                                href="/dashboard/agent"
                                className="flex items-center px-4 py-3 text-base font-medium text-slate-700 rounded-lg hover:bg-slate-50"
                              >
                                <FiUser className="mr-3 h-5 w-5 text-amber-500" aria-hidden="true" />
                                Agent Dashboard
                              </Link>
                            )}
                          </nav>
                        </div>
                      ) : (
                        <div className="space-y-3 px-4">
                          <Link
                            href="/auth/sign-in"
                            className="flex items-center justify-center w-full px-4 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-all"
                          >
                            <FiLogIn className="mr-2 h-5 w-5 text-amber-500" aria-hidden="true" />
                            Sign In
                          </Link>
                          <Link
                            href="/auth/sign-up"
                            className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-lg hover:shadow-md transition-all"
                          >
                            <FiUserPlus className="mr-2 h-5 w-5" aria-hidden="true" />
                            Create Account
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Search Overlay - Luxuriously animated */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={searchOverlayVariants}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md"
          >
            <div className="container mx-auto px-4 sm:px-6 py-5 h-full flex flex-col">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-serif font-light text-slate-900">Search Properties</h2>
                <button
                  onClick={() => setSearchOpen(false)}
                  className="p-2 rounded-full text-slate-500 hover:text-slate-700 bg-slate-50"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-10 max-w-4xl mx-auto w-full">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-amber-500" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="search"
                    placeholder="Search for luxury properties, locations or property types..."
                    className="block w-full pl-12 pr-4 py-5 border-0 border-b-2 border-amber-200 focus:ring-0 focus:border-amber-500 text-xl placeholder:text-slate-400 bg-transparent rounded-none"
                  />
                </div>

                <div className="mt-12">
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Popular searches</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {["Luxury Apartments", "Lagos Waterfront", "Penthouse", "Villa with Pool", "Gated Communities", "Office Space", "Executive Homes"].map(
                      (term) => (
                        <button
                          key={term}
                          onClick={() => {
                            if (searchInputRef.current) {
                              searchInputRef.current.value = term;
                              searchInputRef.current.focus();
                            }
                          }}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-full text-sm font-medium transition-all duration-200 border border-slate-200 hover:border-amber-200"
                        >
                          {term}
                        </button>
                      )
                    )}
                  </div>
                  
                  <div className="mt-12">
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Featured Properties</h3>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[1, 2, 3].map((idx) => (
                        <Link 
                          key={idx}
                          href={`/listings/${idx}`}
                          onClick={() => setSearchOpen(false)}
                          className="group block relative rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                        >
                          <div className="relative h-48">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                            <Image 
                              src={`/images/property-${idx}.jpg`}
                              alt={`Featured luxury property ${idx}`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-0 left-0 p-4 z-20">
                              <p className="text-white font-medium">Luxury Villa {idx}</p>
                              <p className="text-amber-200 text-sm">Lagos, Nigeria</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer to account for header height */}
      <div className={`${scrolled ? "h-[72px]" : "h-[84px]"} transition-all duration-300`} />
    </>
  );
}
