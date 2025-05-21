/**
 * Utility functions for consistent currency formatting
 */

/**
 * Format a number as Nigerian Naira currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to include the currency symbol
 * @returns {string} Formatted currency string
 */
export function formatNaira(amount, showSymbol = true) {
  if (amount === undefined || amount === null) {
    return showSymbol ? "₦0" : "0";
  }

  try {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

    return new Intl.NumberFormat("en-NG", {
      style: showSymbol ? "currency" : "decimal",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(numAmount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return showSymbol ? "₦0" : "0";
  }
}

/**
 * React component for displaying Nigerian Naira currency
 */
export function NairaAmount({ amount, className = "" }) {
  return <span className={className}>{formatNaira(amount)}</span>;
}
