/**
 * Utility for tracking the flow of ID handling throughout the request lifecycle
 */
class IdFlowLogger {
  constructor(context = {}) {
    this.id = context.id || "unknown";
    this.requestId =
      Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
    this.events = [];
    this.startTime = Date.now();
    this.context = context;

    this.log("Flow logger initialized", { context });
  }

  log(message, data = {}) {
    const timestamp = Date.now() - this.startTime;
    const event = {
      timestamp,
      message,
      data: { ...data },
    };

    this.events.push(event);
    console.log(`[ID:${this.id}][${timestamp}ms] ${message}`, data);
    return this;
  }

  error(message, error = {}) {
    const timestamp = Date.now() - this.startTime;
    const event = {
      timestamp,
      type: "error",
      message,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    };

    this.events.push(event);
    console.error(`[ID:${this.id}][${timestamp}ms] ERROR: ${message}`, error);
    return this;
  }

  getReport() {
    return {
      id: this.id,
      requestId: this.requestId,
      totalTime: Date.now() - this.startTime,
      events: this.events,
      context: this.context,
    };
  }

  // Static method for testing ID equality properly
  static compareIds(id1, id2) {
    // Convert both to strings to ensure consistent comparison
    const strId1 = String(id1).trim();
    const strId2 = String(id2).trim();

    const isMatch = strId1 === strId2;
    console.log(
      `Comparing IDs: "${strId1}" vs "${strId2}" => ${
        isMatch ? "MATCH" : "NO MATCH"
      }`
    );
    return isMatch;
  }
}

export default IdFlowLogger;
