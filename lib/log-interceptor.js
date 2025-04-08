/**
 * Utility to temporarily intercept console logs for debugging
 */
export function setupLogInterceptor(options = {}) {
  const logs = [];
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
  };

  // Replace console methods with interceptors
  console.log = (...args) => {
    logs.push({ type: "log", message: args });
    if (options.passthrough !== false) originalConsole.log(...args);
  };

  console.warn = (...args) => {
    logs.push({ type: "warn", message: args });
    if (options.passthrough !== false) originalConsole.warn(...args);
  };

  console.error = (...args) => {
    logs.push({ type: "error", message: args });
    if (options.passthrough !== false) originalConsole.error(...args);
  };

  // Function to restore original console methods
  const restore = () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    return logs;
  };

  return { logs, restore };
}
