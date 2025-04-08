import React from "react";
import Link from "next/link";
import { FiInstagram, FiTwitter, FiFacebook } from "react-icons/fi";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                &copy; {year} TopDial. All rights reserved.
              </p>
            </div>

            {/* Links */}
            <div className="flex space-x-6">
              <Link
                href="/privacy"
                className="text-sm text-gray-500 hover:text-wine"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-gray-500 hover:text-wine"
              >
                Terms of Service
              </Link>
              <Link
                href="/contact"
                className="text-sm text-gray-500 hover:text-wine"
              >
                Contact Us
              </Link>
            </div>

            {/* Social Media */}
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-wine">
                <FiInstagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-wine">
                <FiTwitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-wine">
                <FiFacebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
