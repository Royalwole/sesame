import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { UserButton, useUser } from "@clerk/nextjs";
import { FiHome, FiBell, FiMessageCircle, FiMenu, FiX } from "react-icons/fi";

export default function AgentHeader() {
  const router = useRouter();
  const { user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    if (typeof window !== "undefined") {
      const mobileMenu = document.getElementById("agent-mobile-menu");
      if (mobileMenu) {
        mobileMenu.style.display = "none";
      }
    }
  }, [router.pathname]);

  // Setup global menu toggle function with vanilla JS
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Define a global function to toggle the menu
      window.toggleAgentMobileMenu = function () {
        const mobileMenu = document.getElementById("agent-mobile-menu");
        const currentDisplay = mobileMenu.style.display;

        if (currentDisplay === "none" || currentDisplay === "") {
          // Open menu
          mobileMenu.style.display = "block";
          setTimeout(() => {
            mobileMenu.style.opacity = "1";
            mobileMenu.style.maxHeight = "1000px";
          }, 10);
          setIsMenuOpen(true);
        } else {
          // Close menu
          mobileMenu.style.opacity = "0";
          mobileMenu.style.maxHeight = "0";
          setTimeout(() => {
            mobileMenu.style.display = "none";
          }, 300);
          setIsMenuOpen(false);
        }
      };
    }

    return () => {
      // Clean up when component unmounts
      if (typeof window !== "undefined") {
        delete window.toggleAgentMobileMenu;
      }
    };
  }, []);

  // Navigation links for agent
  const navLinks = [
    { name: "Dashboard", href: "/dashboard/agent" },
    { name: "Listings", href: "/dashboard/agent/listings" },
    { name: "Profile", href: "/dashboard/agent/profile" },
    { name: "Messages", href: "/dashboard/agent/messages" },
  ];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and Brand */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
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
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === link.href ||
                  (link.href !== "/dashboard/agent" &&
                    router.pathname.startsWith(link.href))
                    ? "text-wine"
                    : "text-gray-500 hover:text-wine"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center">
            <button className="p-2 rounded-full text-gray-500 hover:text-wine">
              <FiBell className="h-5 w-5" />
            </button>
            <button className="p-2 rounded-full text-gray-500 hover:text-wine ml-3">
              <FiMessageCircle className="h-5 w-5" />
            </button>
            <div className="ml-4">
              <UserButton />
            </div>

            {/* Mobile menu button with direct onclick attribute */}
            <div className="flex md:hidden ml-3">
              <button
                data-testid="agent-mobile-menu-button"
                onClick={() => window.toggleAgentMobileMenu()}
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-wine hover:bg-gray-100 focus:outline-none"
              >
                {isMenuOpen ? (
                  <FiX className="block h-6 w-6" />
                ) : (
                  <FiMenu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation with ID for direct DOM access */}
      <div
        id="agent-mobile-menu"
        style={{
          display: "none",
          transition: "opacity 0.3s ease-in-out, max-height 0.3s ease-in-out",
          maxHeight: "0",
          opacity: "0",
        }}
        className="md:hidden bg-white border-t border-gray-200 absolute w-full z-20 shadow-lg"
      >
        <div className="pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`block pl-3 pr-4 py-2 text-base font-medium ${
                router.pathname === link.href ||
                (link.href !== "/dashboard/agent" &&
                  router.pathname.startsWith(link.href))
                  ? "bg-wine/10 text-wine border-l-4 border-wine"
                  : "text-gray-600 hover:bg-gray-50 hover:text-wine"
              }`}
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.toggleAgentMobileMenu();
                }
              }}
            >
              {link.name}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
