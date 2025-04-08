import React, { useEffect, useRef } from 'react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  footer,
  closeOnOutsideClick = true,
}) {
  const modalRef = useRef(null);
  
  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Handle outside click to close modal
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (closeOnOutsideClick && modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, onClose, closeOnOutsideClick]);
  
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  // Modal size styles
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6 text-center">
        {/* Backdrop */}
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75"></div>
        </div>
        
        {/* Modal panel */}
        <div 
          ref={modalRef}
          className={`
            inline-block w-full ${sizeClasses[size] || sizeClasses.md} 
            text-left align-middle bg-white rounded-lg shadow-xl 
            transform transition-all
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-headline"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900" id="modal-headline">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">{children}</div>
          
          {/* Footer */}
          {footer && (
            <div className="px-4 py-3 bg-gray-50 flex justify-end space-x-2 border-t border-gray-200 rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
