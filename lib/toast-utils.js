/**
 * Safer toast notification utilities
 */
import toast from "react-hot-toast";

/**
 * Safe version of toast.success that won't crash if toast is not available
 */
export function safeSuccess(message, options = {}) {
  try {
    return toast.success(message, options);
  } catch (e) {
    console.log("[Toast Success]", message);
    return null;
  }
}

/**
 * Safe version of toast.error that won't crash if toast is not available
 */
export function safeError(message, options = {}) {
  try {
    return toast.error(message, options);
  } catch (e) {
    console.error("[Toast Error]", message);
    return null;
  }
}

/**
 * Safe version of toast.loading that won't crash if toast is not available
 */
export function safeLoading(message, options = {}) {
  try {
    return toast.loading(message, options);
  } catch (e) {
    console.log("[Toast Loading]", message);
    return null;
  }
}

/**
 * Update a toast safely
 */
export function safeUpdateToast(id, message, type = "success") {
  if (!id) return null;

  try {
    if (type === "success") {
      return toast.success(message, { id });
    } else if (type === "error") {
      return toast.error(message, { id });
    } else {
      return toast(message, { id });
    }
  } catch (e) {
    console.log(`[Toast Update: ${type}]`, message);
    return null;
  }
}
