/**
 * Utility functions for handling form submissions safely
 */

/**
 * Prevents accidental form submissions from keyboard events
 * @param {Event} e - The event object
 * @returns {boolean} - Returns false if the submission should be prevented
 */
export function preventAccidentalSubmit(e) {
  // Check if the form submission was triggered by Enter key in an input field
  const target = e.target;

  // Allow submission only if it was triggered by a button click
  if (
    e.nativeEvent &&
    e.nativeEvent.submitter &&
    e.nativeEvent.submitter.tagName === "BUTTON" &&
    e.nativeEvent.submitter.type === "submit"
  ) {
    return true;
  }

  // If the target is an input or textarea, prevent form submission on Enter key
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
    if (target.type !== "submit" && target.type !== "button") {
      console.log("Preventing accidental form submit from input field");
      e.preventDefault();
      return false;
    }
  }

  return true;
}

/**
 * Creates a safe submit handler that prevents accidental submissions
 * @param {Function} handler - The original submit handler
 * @returns {Function} - A wrapped handler that prevents accidental submissions
 */
export function createSafeSubmitHandler(handler) {
  return (e) => {
    e.preventDefault(); // Always prevent default first

    // If it was an accidental submission, don't call the handler
    if (preventAccidentalSubmit(e) === false) {
      return;
    }

    // Otherwise, call the original handler
    if (typeof handler === "function") {
      handler(e);
    }
  };
}

/**
 * HOC to make a form component safe from accidental submissions
 * @param {React.Component} FormComponent - The form component to wrap
 * @returns {React.Component} - A safer form component
 */
export function withSafeFormSubmission(FormComponent) {
  return (props) => {
    const safeOnSubmit = createSafeSubmitHandler(props.onSubmit);
    return <FormComponent {...props} onSubmit={safeOnSubmit} />;
  };
}
