/**
 * FormUtilityComponents.js - Enhanced form components to prevent accidental form submissions
 *
 * This file contains form utility components that help prevent accidental form submissions,
 * specifically when users press the Enter key while focused on input fields.
 */

import React from "react";
import {
  preventAccidentalSubmit,
  withSafeFormSubmission,
} from "../../lib/form-submission-utils";

/**
 * SafeInput component that prevents form submission when Enter is pressed
 */
export const SafeInput = React.forwardRef(
  ({ preventEnterSubmit = true, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e) => {
      // Prevent form submission on Enter key
      if (preventEnterSubmit && e.key === "Enter") {
        e.preventDefault();
      }

      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return <input ref={ref} onKeyDown={handleKeyDown} {...props} />;
  }
);

SafeInput.displayName = "SafeInput";

/**
 * SafeTextarea component - no need to prevent Enter key as it's expected behavior
 */
export const SafeTextarea = React.forwardRef((props, ref) => {
  return <textarea ref={ref} {...props} />;
});

SafeTextarea.displayName = "SafeTextarea";

/**
 * SafeForm component that prevents accidental submissions
 */
export const SafeForm = ({ onSubmit, children, ...props }) => {
  const handleSubmit = (e) => {
    e.preventDefault();

    // Only allow submission if it was explicitly triggered
    if (preventAccidentalSubmit(e)) {
      if (onSubmit) {
        onSubmit(e);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
};

/**
 * Create a form with validation and safe submission handling
 */
export const createSafeFormWithValidation = (FormComponent) => {
  // Apply the withSafeFormSubmission HOC to prevent accidental submissions
  return withSafeFormSubmission(FormComponent);
};
