/**
 * Format a date string or timestamp in a readable format
 * @param {String|Number|Date} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {String} - Formatted date string
 */
export function formatDate(date, options = {}) {
  if (!date) return "";

  try {
    const dateObj = new Date(date);

    // Return empty string for invalid dates
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    // Default options
    const defaultOptions = {
      weekday: undefined,
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: undefined,
      minute: undefined,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    return dateObj.toLocaleDateString("en-US", mergedOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "";
  }
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param {String|Number|Date} date - Date to format
 * @returns {String} - Relative time string
 */
export function formatRelativeTime(date) {
  if (!date) return "";

  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
      return "just now";
    }

    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    }

    // Fall back to standard date format
    return formatDate(date);
  } catch (error) {
    console.error("Error formatting relative time:", error);
    return "";
  }
}
