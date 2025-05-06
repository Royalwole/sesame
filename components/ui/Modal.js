import React, { useEffect, useRef, useState } from "react";
import { useHydration } from "../../lib/useHydration";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  footer,
  closeOnOutsideClick = true,
}) {
  const modalRef = useRef(null);
  const isHydrated = useHydration();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle escape key press
  useEffect(() => {
    if (!mounted || !isHydrated) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, mounted, isHydrated]);

  // Handle outside click
  useEffect(() => {
    if (!mounted || !isHydrated) return;

    const handleOutsideClick = (e) => {
      if (
        closeOnOutsideClick &&
        modalRef.current &&
        !modalRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen, onClose, closeOnOutsideClick, mounted, isHydrated]);

  // Handle body scroll lock
  useEffect(() => {
    if (!mounted || !isHydrated) return;

    if (isOpen) {
      // Store the current scroll position and body styles
      const scrollY = window.scrollY;
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // Apply the scroll lock
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      // Restore body styles and scroll position
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen, mounted, isHydrated]);

  // Don't render until after hydration
  if (!mounted || !isHydrated || !isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-full mx-4",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={closeOnOutsideClick ? onClose : undefined}
        />

        <div
          ref={modalRef}
          className={`${sizeClasses[size]} w-full transform overflow-hidden rounded-lg bg-white p-6 text-left align-middle shadow-xl transition-all`}
        >
          {title && (
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="rounded-md p-1 hover:bg-gray-100 focus:outline-none"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          )}

          <div className="mt-2">{children}</div>

          {footer && <div className="mt-4">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
