/**
 * Debug utility for tracking listing operations
 */

import {
  getListingById,
  fetchListings,
  getAgentListings,
  getPublicListings,
  recoverListingById,
  fetchWithTimeout,
} from "./listing-api-wrapper";

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

  /**
   * Debug function that calls various listing API methods and reports results
   */
  static async debugListingApi(listingId) {
    console.log("🔍 Running Listing API Debug Tool...");
    const debugResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      success: true,
      errors: [],
    };

    try {
      // Test 1: Verify module imports
      debugResults.tests.moduleImports = {
        name: "Module Imports",
        status: "success",
        details: "All required listing API modules loaded correctly",
      };

      // Test 2: Public listings fetch
      try {
        console.log("Testing getPublicListings...");
        const publicListingsResult = await getPublicListings({}, 1, 5);

        debugResults.tests.publicListings = {
          name: "Public Listings",
          status: publicListingsResult.success ? "success" : "warning",
          count: publicListingsResult.listings?.length || 0,
          pagination: publicListingsResult.pagination,
          fallback: !!publicListingsResult.fallback,
          details: publicListingsResult.fallback
            ? "Retrieved fallback data - API might be partially working"
            : "Successfully retrieved public listings",
        };
      } catch (error) {
        debugResults.tests.publicListings = {
          name: "Public Listings",
          status: "failed",
          error: error.message,
          details: "Failed to retrieve public listings",
        };
        debugResults.errors.push(`Public listings error: ${error.message}`);
        debugResults.success = false;
      }

      // Test 3: Agent listings fetch
      try {
        console.log("Testing getAgentListings...");
        const agentListingsResult = await getAgentListings(1, 5);

        debugResults.tests.agentListings = {
          name: "Agent Listings",
          status: agentListingsResult.success ? "success" : "warning",
          count: agentListingsResult.listings?.length || 0,
          fallback: !!agentListingsResult.fallback,
          details: agentListingsResult.fallback
            ? "Retrieved fallback data - API might be partially working"
            : "Successfully retrieved agent listings",
        };
      } catch (error) {
        debugResults.tests.agentListings = {
          name: "Agent Listings",
          status: "failed",
          error: error.message,
          details: "Failed to retrieve agent listings",
        };
        debugResults.errors.push(`Agent listings error: ${error.message}`);
        debugResults.success = false;
      }

      // Test 4: Get specific listing by ID
      if (listingId) {
        try {
          console.log(`Testing getListingById with ID: ${listingId}...`);
          const listingResult = await getListingById(listingId);

          debugResults.tests.listingById = {
            name: "Listing By ID",
            status: listingResult.success ? "success" : "warning",
            listingId,
            listingFound: !!listingResult.listing,
            title: listingResult.listing?.title || null,
            details: listingResult.success
              ? `Successfully retrieved listing: ${listingResult.listing?.title || "Untitled"}`
              : `Failed to retrieve listing: ${listingResult.error || "Unknown error"}`,
          };
        } catch (error) {
          debugResults.tests.listingById = {
            name: "Listing By ID",
            status: "failed",
            error: error.message,
            details: `Failed to retrieve listing with ID: ${listingId}`,
          };
          debugResults.errors.push(`Listing by ID error: ${error.message}`);
          debugResults.success = false;
        }

        // Test 5: Test recovery functionality
        try {
          console.log(`Testing recoverListingById with ID: ${listingId}...`);
          const recoveryResult = await recoverListingById(listingId);

          debugResults.tests.listingRecovery = {
            name: "Listing Recovery",
            status: recoveryResult.success ? "success" : "warning",
            recoveryWorked: recoveryResult.success,
            recoveryDetails: recoveryResult.recoveryDetails,
            details: recoveryResult.success
              ? `Successfully recovered listing using methods: ${recoveryResult.recoveryDetails?.methods?.join(", ") || "unknown"}`
              : `Recovery failed: ${recoveryResult.error || "Unknown recovery error"}`,
          };
        } catch (error) {
          debugResults.tests.listingRecovery = {
            name: "Listing Recovery",
            status: "failed",
            error: error.message,
            details: `Failed to recover listing with ID: ${listingId}`,
          };
          debugResults.errors.push(`Listing recovery error: ${error.message}`);
        }
      }

      // Test 6: Test fetch utilities
      try {
        console.log("Testing fetchWithTimeout...");
        const fetchResult = await fetchWithTimeout(
          "/api/health",
          {
            headers: { "Cache-Control": "no-cache" },
          },
          5000
        );

        const responseText = await fetchResult.text();

        debugResults.tests.fetchUtilities = {
          name: "Fetch Utilities",
          status: fetchResult.ok ? "success" : "warning",
          httpStatus: fetchResult.status,
          details: fetchResult.ok
            ? "Successfully tested fetch utilities"
            : `Fetch returned status ${fetchResult.status}`,
        };
      } catch (error) {
        debugResults.tests.fetchUtilities = {
          name: "Fetch Utilities",
          status: "failed",
          error: error.message,
          details: "Failed to test fetch utilities",
        };
        debugResults.errors.push(`Fetch utilities error: ${error.message}`);
        debugResults.success = false;
      }

      // Add results to logs
      this.logOperation("API_DEBUG_COMPLETE", {
        success: debugResults.success,
        errorCount: debugResults.errors.length,
        tests: Object.keys(debugResults.tests).map((k) => ({
          name: debugResults.tests[k].name,
          status: debugResults.tests[k].status,
        })),
      });

      // Return formatted results
      return {
        ...debugResults,
        summary: debugResults.success
          ? "All listing API components appear to be working correctly"
          : `${debugResults.errors.length} error(s) found with listing API`,
      };
    } catch (error) {
      console.error("Debugger crashed:", error);
      this.logOperation("API_DEBUG_CRASHED", { error: error.message });
      return {
        timestamp: new Date().toISOString(),
        tests: {},
        success: false,
        errors: [`Debugger crashed: ${error.message}`],
        summary: "Listing API debugger crashed unexpectedly",
      };
    }
  }

  /**
   * Run a quick health check on the listing API
   */
  static async quickHealthCheck() {
    try {
      // Test module loading
      const moduleLoaded =
        typeof getListingById === "function" &&
        typeof fetchListings === "function";

      // Test a basic API call
      let apiWorking = false;
      try {
        const publicListingsResult = await getPublicListings({}, 1, 1);
        apiWorking = publicListingsResult && !publicListingsResult.error;
      } catch (e) {
        apiWorking = false;
      }

      const result = {
        healthy: moduleLoaded && apiWorking,
        moduleLoaded,
        apiWorking,
        timestamp: new Date().toISOString(),
      };

      this.logOperation("HEALTH_CHECK", result);
      return result;
    } catch (error) {
      const result = {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      this.logOperation("HEALTH_CHECK_FAILED", result);
      return result;
    }
  }
}

export const debugListingApi =
  ListingDebugger.debugListingApi.bind(ListingDebugger);
export const quickHealthCheck =
  ListingDebugger.quickHealthCheck.bind(ListingDebugger);

export default ListingDebugger;
