import { withAuth } from "../../../../lib/withAuth";
import { validatePermission } from "../../../../lib/permissions-manager";
import { apiResponse } from "../../../../lib/api-response";
import { db } from "../../../../lib/db";
import { ObjectId } from "mongodb";
import { applyBundleToUser } from "../../../../lib/permission-bundles";

/**
 * API endpoint for managing a specific permission request
 *
 * GET: Retrieve a specific permission request
 * PUT: Process a permission request (approve/deny)
 * DELETE: Delete a permission request
 */
async function handler(req, res) {
  try {
    const { user: adminUser } = req;
    const { id } = req.query;

    if (!id) {
      return apiResponse(res, 400, {
        error: "Request ID is required",
      });
    }

    // Check admin permission
    if (!validatePermission("ADMIN:MANAGE_PERMISSIONS", adminUser)) {
      return apiResponse(res, 403, {
        error: "You do not have permission to manage permission requests",
      });
    }

    try {
      // Get the request
      const requestId = new ObjectId(id);
      const permissionRequest = await db
        .collection("permissionRequests")
        .findOne({ _id: requestId });

      if (!permissionRequest) {
        return apiResponse(res, 404, {
          error: "Permission request not found",
        });
      }

      // Handle GET request - retrieve a specific permission request
      if (req.method === "GET") {
        return apiResponse(res, 200, {
          success: true,
          request: permissionRequest,
        });
      }

      // Handle PUT request - process a permission request (approve/deny)
      if (req.method === "PUT") {
        const { action, notes } = req.body;

        if (!action || !["approve", "deny"].includes(action)) {
          return apiResponse(res, 400, {
            error: "Valid action (approve or deny) is required",
          });
        }

        // If request is already processed
        if (permissionRequest.status !== "pending") {
          return apiResponse(res, 400, {
            error: `This request has already been ${permissionRequest.status}`,
          });
        }

        // Update the request status
        const updateData = {
          status: action === "approve" ? "approved" : "denied",
          reviewedBy: {
            id: adminUser.id,
            name: adminUser.firstName
              ? `${adminUser.firstName} ${adminUser.lastName || ""}`.trim()
              : adminUser.name || adminUser.username || "Admin",
            email:
              adminUser.emailAddresses?.[0]?.emailAddress ||
              adminUser.email ||
              "",
          },
          reviewNotes: notes || null,
          updatedAt: new Date(),
        };

        await db
          .collection("permissionRequests")
          .updateOne({ _id: requestId }, { $set: updateData });

        // If approved, grant the requested permission or bundle
        if (action === "approve") {
          // Get the user from the database
          const userId = permissionRequest.user.id;
          const usersCollection = db.collection("users");
          const targetUser = await usersCollection.findOne({
            $or: [{ _id: userId }, { clerkId: userId }],
          });

          if (!targetUser) {
            return apiResponse(res, 404, {
              error: "User not found",
            });
          }

          // Handle bundle application
          if (permissionRequest.bundleId) {
            try {
              await applyBundleToUser(
                targetUser._id,
                permissionRequest.bundleId,
                {
                  temporary:
                    permissionRequest.requestedDuration === "temporary",
                  expiresAt: permissionRequest.requestedExpiration,
                  reason: `Approved via request #${requestId}`,
                  grantedBy: adminUser.id,
                }
              );
            } catch (error) {
              console.error("Error applying bundle:", error);
              return apiResponse(res, 500, {
                error: `Failed to apply permission bundle: ${error.message}`,
              });
            }
          }
          // Handle individual permission grant
          else if (permissionRequest.permission) {
            // Initialize permissions array if it doesn't exist
            const currentPermissions = targetUser.permissions || [];

            // Check if permission is already granted
            if (!currentPermissions.includes(permissionRequest.permission)) {
              const updatedPermissions = [
                ...currentPermissions,
                permissionRequest.permission,
              ];

              // Add permission metadata
              const permissionMetadata = targetUser.permissionMetadata || {};

              if (permissionRequest.requestedDuration === "temporary") {
                permissionMetadata[permissionRequest.permission] = {
                  temporary: true,
                  expiration: permissionRequest.requestedExpiration,
                  reason: permissionRequest.justification,
                  requestId: permissionRequest._id.toString(),
                  grantedBy: adminUser.id,
                  grantedAt: new Date(),
                };
              } else {
                permissionMetadata[permissionRequest.permission] = {
                  temporary: false,
                  reason: permissionRequest.justification,
                  requestId: permissionRequest._id.toString(),
                  grantedBy: adminUser.id,
                  grantedAt: new Date(),
                };
              }

              // If resource-specific permission
              if (permissionRequest.resourceId) {
                permissionMetadata[
                  permissionRequest.permission
                ].resourceSpecific = true;
                permissionMetadata[permissionRequest.permission].resourceId =
                  permissionRequest.resourceId;
                permissionMetadata[permissionRequest.permission].resourceType =
                  permissionRequest.resourceType;
              }

              // Update user permissions
              await usersCollection.updateOne(
                { _id: targetUser._id },
                {
                  $set: {
                    permissions: updatedPermissions,
                    permissionMetadata,
                  },
                }
              );
            }
          }

          return apiResponse(res, 200, {
            success: true,
            message: "Permission request approved successfully",
          });
        } else {
          // For denied requests, we just update the status
          return apiResponse(res, 200, {
            success: true,
            message: "Permission request denied",
          });
        }
      }

      // Handle DELETE request - delete a permission request
      if (req.method === "DELETE") {
        const result = await db
          .collection("permissionRequests")
          .deleteOne({ _id: requestId });

        if (result.deletedCount === 1) {
          return apiResponse(res, 200, {
            success: true,
            message: "Permission request deleted successfully",
          });
        } else {
          return apiResponse(res, 404, {
            error: "Permission request not found or could not be deleted",
          });
        }
      }

      // Method not allowed
      return apiResponse(res, 405, {
        error: "Method not allowed",
      });
    } catch (error) {
      if (error.message.includes("Invalid ObjectId")) {
        return apiResponse(res, 400, {
          error: "Invalid request ID format",
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("Error handling permission request:", error);
    return apiResponse(res, 500, {
      error: "An error occurred while processing your request",
    });
  }
}

export default withAuth(handler);
