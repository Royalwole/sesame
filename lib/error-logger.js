/**
 * Centralized error logging with request IDs
 */
export default class ErrorLogger {
  constructor(context = {}) {
    this.requestId =
      Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    this.context = context;
    this.startTime = Date.now();
  }

  log(message, data = {}) {
    console.log(
      `[${this.requestId}][${Date.now() - this.startTime}ms] ${message}`,
      data
    );
  }

  warn(message, data = {}) {
    console.warn(
      `[${this.requestId}][${
        Date.now() - this.startTime
      }ms] WARNING: ${message}`,
      data
    );
  }

  error(message, error = null) {
    console.error(
      `[${this.requestId}][${Date.now() - this.startTime}ms] ERROR: ${message}`,
      error || ""
    );
  }

  // Wrap an async function with error logging
  async trackAsync(name, func) {
    this.log(`Starting: ${name}`);
    const start = Date.now();

    try {
      const result = await func();
      const duration = Date.now() - start;
      this.log(`Completed: ${name} (${duration}ms)`);
      return result;
    } catch (err) {
      const duration = Date.now() - start;
      this.error(`Failed: ${name} (${duration}ms)`, err);
      throw err;
    }
  }
}
