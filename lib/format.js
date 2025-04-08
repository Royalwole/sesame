/**
 * Formatting utilities
 */

/**
 * Formats a number as currency
 * @param {Number} amount - Amount to format
 * @param {String} currency - Currency code (default: NGN)
 * @returns {String} - Formatted currency string
 */
export function formatCurrency(amount, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a date in the local format
 * @param {Date|String} date - Date to format
 * @returns {String} - Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Formats a number with thousands separators
 * @param {Number} number - Number to format
 * @returns {String} - Formatted number string
 */
export function formatNumber(number) {
  return new Intl.NumberFormat("en-NG").format(number);
}

/**
 * Truncates text to a specified length
 * @param {String} text - Text to truncate
 * @param {Number} maxLength - Maximum length
 * @returns {String} - Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
