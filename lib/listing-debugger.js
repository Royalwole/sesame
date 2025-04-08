/**
 * Debug utility for tracking listing operations
 */

class ListingDebugger {
  static enabled = process.env.NODE_ENV === "development";
  static logs = [];
  static maxLogs = 50;

  static logOperation(operation, data) {
    if (!this.enabled) return;

    const timestamp = new Date();
    const entry = {
      timestamp,
      operation,
      data,
    };

    // Add to logs with max size limit
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Also output to console for immediate visibility
    console.log(`[ListingDebugger] ${operation}`, data);

    return entry;
  }

  static getLogs() {
    return this.logs;
  }

  static clearLogs() {
    this.logs = [];
  }

  // Track ID-related operations specifically
  static trackId(operation, id, context = {}) {
    return this.logOperation(`ID:${operation}`, {
      id,
      idType: typeof id,
      idString: String(id),
      ...context,
    });
  }

  static validateIds(requestId, responseId, context = {}) {
    // Convert both to strings for safe comparison
    const reqStr = String(requestId);
    const resStr = String(responseId);
    const match = reqStr === resStr;

    this.logOperation("ID:Validation", {
      requestId: reqStr,
      responseId: resStr,
      match,
      ...context,
    });

    return match;
  }
}

export default ListingDebugger;
