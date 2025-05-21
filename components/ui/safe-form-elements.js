import React from "react";

/**
 * A safe input component that prevents accidental form submissions
 * via Enter key unless explicitly intended
 */
const SafeInput = React.forwardRef(
  ({ preventEnterSubmit = true, onKeyDown, ...props }, ref) => {
    // Handle keyboard events to prevent form submission
    const handleKeyDown = (e) => {
      // Prevent form submission on Enter key
      if (preventEnterSubmit && e.key === "Enter") {
        e.preventDefault();
      }

      // Call the original onKeyDown handler if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return <input ref={ref} onKeyDown={handleKeyDown} {...props} />;
  }
);

SafeInput.displayName = "SafeInput";

/**
 * A safe textarea component that prevents accidental form submissions
 * via Enter key unless explicitly intended
 */
const SafeTextarea = React.forwardRef(
  (
    {
      preventEnterSubmit = false, // Default false for textarea as Enter creates new lines
      onKeyDown,
      ...props
    },
    ref
  ) => {
    // Handle keyboard events to prevent form submission
    const handleKeyDown = (e) => {
      // Only prevent submission on Ctrl+Enter or similar combinations
      if (preventEnterSubmit && e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }

      // Call the original onKeyDown handler if provided
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    return <textarea ref={ref} onKeyDown={handleKeyDown} {...props} />;
  }
);

SafeTextarea.displayName = "SafeTextarea";

/**
 * A wrapper for any form that prevents accidental submissions
 */
const SafeForm = ({
  onSubmit,
  preventAccidentalSubmit = true,
  children,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();

    // Only continue with submission if it wasn't triggered by an input field
    const target = e.target;
    const targetName = e.target.tagName.toLowerCase();
    const submitter = e.nativeEvent?.submitter;

    let isAccidentalSubmit = false;

    if (preventAccidentalSubmit) {
      // Consider it accidental if:
      // 1. Not triggered by a submit button
      // 2. Triggered by Enter key in an input that's not a submit button
      if (!submitter) {
        if (
          target.activeElement &&
          (target.activeElement.tagName === "INPUT" ||
            target.activeElement.tagName === "TEXTAREA")
        ) {
          isAccidentalSubmit = true;
        }
      }
    }

    if (!isAccidentalSubmit && onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} {...props}>
      {children}
    </form>
  );
};

export { SafeInput, SafeTextarea, SafeForm };
