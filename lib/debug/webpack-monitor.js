/**
 * Webpack monitoring utility
 * Helps identify and resolve webpack configuration issues
 */

// Track webpack compilation issues
let compilationIssues = [];
const MAX_ISSUES = 50;

/**
 * Register an issue with webpack compilation
 * @param {Object} issue - The compilation issue
 */
export function registerWebpackIssue(issue) {
  compilationIssues.unshift({
    timestamp: new Date().toISOString(),
    ...issue,
  });

  // Keep issue list at reasonable size
  if (compilationIssues.length > MAX_ISSUES) {
    compilationIssues.pop();
  }
}

/**
 * Get recent compilation issues
 * @param {number} limit - Maximum number of issues to return
 * @returns {Array} - Recent compilation issues
 */
export function getCompilationIssues(limit = 10) {
  return compilationIssues.slice(0, limit);
}

/**
 * Clear compilation issues list
 */
export function clearCompilationIssues() {
  compilationIssues = [];
}

/**
 * Generate recommendations for fixing webpack issues
 * @param {Object} issue - The webpack issue to analyze
 * @returns {Array<string>} - Recommendations for fixing the issue
 */
export function getWebpackRecommendations(issue) {
  const recommendations = [];

  if (!issue) return recommendations;

  // Module not found errors
  if (issue.message && issue.message.includes("Module not found")) {
    const moduleMatch = issue.message.match(
      /Module not found: Error: Can't resolve '([^']+)'/
    );
    const missingModule = moduleMatch ? moduleMatch[1] : null;

    if (missingModule) {
      recommendations.push(
        `Install the missing module: npm install ${missingModule}`
      );

      // Special handling for common modules
      if (missingModule.startsWith("@")) {
        // Scoped package
        recommendations.push(
          `For scoped package ${missingModule}, ensure you're using the correct package name`
        );
      } else if (missingModule.includes("/")) {
        // Subpath import
        const mainPackage = missingModule.split("/")[0];
        recommendations.push(
          `Check if ${mainPackage} is installed and provides the subpath correctly`
        );
      } else {
        recommendations.push(
          `Verify the spelling of the module name: ${missingModule}`
        );
      }

      recommendations.push(
        `Check your jsconfig.json or tsconfig.json for path aliases`
      );
    }
  }

  // CORS issues
  if (issue.message && issue.message.includes("CORS")) {
    recommendations.push(`Add appropriate CORS headers to your API responses`);
    recommendations.push(
      `Check your next.config.js for any proxy configurations`
    );
  }

  // SVG issues
  if (issue.message && issue.message.includes(".svg")) {
    recommendations.push(
      `Ensure @svgr/webpack is installed: npm install --save-dev @svgr/webpack`
    );
    recommendations.push(
      `Verify your webpack config has the correct rule for SVG files`
    );
  }

  // General recommendations
  recommendations.push(
    `Check the webpack configuration in your next.config.js file`
  );
  recommendations.push(
    `Verify all dependencies are properly installed and up-to-date`
  );

  return recommendations;
}

/**
 * Check for common webpack misconfigurations
 * @param {Object} config - Webpack configuration object
 * @returns {Array<string>} - Warnings about potential misconfigurations
 */
export function checkWebpackConfig(config) {
  const warnings = [];

  if (!config) {
    warnings.push("No webpack configuration provided");
    return warnings;
  }

  // Check for resolve fallbacks
  if (!config.resolve || !config.resolve.fallback) {
    warnings.push(
      "Missing resolve.fallback configuration for browser polyfills"
    );
  }

  // Check for module rules
  if (
    !config.module ||
    !config.module.rules ||
    config.module.rules.length === 0
  ) {
    warnings.push("No module rules configured in webpack");
  }

  // Check for SVG handling
  let hasSvgRule = false;
  if (config.module && config.module.rules) {
    for (const rule of config.module.rules) {
      if (rule.test && rule.test.toString().includes("svg")) {
        hasSvgRule = true;
        break;
      }
    }
  }

  if (!hasSvgRule) {
    warnings.push("No SVG handling rule found in webpack configuration");
  }

  return warnings;
}

export default {
  registerWebpackIssue,
  getCompilationIssues,
  clearCompilationIssues,
  getWebpackRecommendations,
  checkWebpackConfig,
};
