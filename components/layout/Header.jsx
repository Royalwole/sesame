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
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useHydration } from "../../lib/useHydration";

export default function Header() {
  const isHydrated = useHydration(); // Track hydration state
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { isAdmin, isAgent } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const previousScrollY = useRef(0);

  const navRef = useRef(null);
  const accountMenuRef = useRef(null);
  const searchInputRef = useRef(null);

  // Mount tracking
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll events with RAF for performance
  useEffect(() => {
    if (!mounted || !isHydrated) return;

    let rafId;
    function handleScroll() {
      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        setScrolled(currentScrollY > 20);
        previousScrollY.current = currentScrollY;
      });
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mounted, isHydrated]);

  // Handle mobile menu and search state
  useEffect(() => {
    if (!mounted || !isHydrated) return;

    if (mobileMenuOpen || searchOpen) {
      // Store current scroll position and lock scroll
      previousScrollY.current = window.scrollY;
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      document.body.style.position = "fixed";
      document.body.style.top = `-${previousScrollY.current}px`;
      document.body.style.width = "100%";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Restore scroll position
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
      window.scrollTo(0, previousScrollY.current);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
    };
  }, [mobileMenuOpen, searchOpen, mounted, isHydrated]);

  // Reset menu state on route change
  useEffect(() => {
    if (!mounted || !isHydrated) return;
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [router.asPath, mounted, isHydrated]);

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
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const searchOverlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } },
  };

  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: "100%", transition: { duration: 0.3 } },
  };

  return (
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
                {/* Fixed Image component implementation */}
                <Image
                  src="/logo.svg"
                  alt="Topdial"
                  width={150}
                  height={52}
                  className={`transition-all duration-300 ${
                    mounted && scrolled ? "scale-[0.87]" : ""
                  }`}
                  priority
                />
                <div className="absolute -bottom-1 left-0 w-12 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300"></div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation - Conditionally render content based on hydration state */}
          <div
            className={`hidden lg:flex lg:items-center lg:justify-center lg:space-x-8 ${
              !mounted || !isHydrated ? "invisible" : "visible"
            }`}
          >
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

          {/* Desktop Right Actions - Conditionally show based on hydration state */}
          <div
            className={`hidden md:flex md:items-center md:space-x-4 ${
              !mounted || !isHydrated ? "invisible" : "visible"
            }`}
          >
            {/* Premium search button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors flex items-center"
              aria-label="Search"
              disabled={!mounted || !isHydrated}
            >
              <FiSearch className="w-5 h-5" />
            </button>

            {/* Authentication - Only show when fully loaded */}
            {isLoaded && (
              <>
                {isSignedIn ? (
                  <div className="relative ml-3" ref={accountMenuRef}>
                    <div>
                      <button
                        onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                        className="flex items-center text-slate-700 hover:text-slate-900 px-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100 text-sm font-medium gap-x-1 transition-all duration-200 border border-slate-100"
                        aria-expanded={accountMenuOpen}
                        disabled={!mounted || !isHydrated}
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
                      {accountMenuOpen && mounted && isHydrated && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          variants={menuVariants}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl ring-1 ring-black/5 py-1 z-50 overflow-hidden border border-slate-100"
                          role="menu"
                        >
                          {/* Rest of the menu content */}
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
                        </motion.div>
                      )}
                    </AnimatePresence>
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

          {/* Mobile menu button - Available during hydration but not functional */}
          <div className="flex lg:hidden">
            <button
              onClick={() => (isHydrated && mounted ? setMobileMenuOpen(true) : null)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-full transition-colors"
              aria-label="Open menu"
              disabled={!isHydrated || !mounted}
            >
              <FiMenu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
