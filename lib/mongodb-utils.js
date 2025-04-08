import mongoose from "mongoose";

/**
 * Safely converts any value to a MongoDB ObjectId
 * Returns null if conversion fails
 */
export function safeObjectId(id) {
  try {
    if (!id) return null;

    // Already an ObjectId instance
    if (id instanceof mongoose.Types.ObjectId) {
      return id;
    }

    // String ID that can be converted
    if (typeof id === "string" && mongoose.Types.ObjectId.isValid(id)) {
      return new mongoose.Types.ObjectId(id);
    }

    return null;
  } catch (err) {
    console.error("Failed to convert to ObjectId:", err);
    return null;
  }
}

/**
 * Safely compare MongoDB IDs regardless of their type (string or ObjectId)
 */
export function isSameMongoId(id1, id2) {
  if (!id1 || !id2) return false;

  try {
    // Convert both to strings for safe comparison
    const strId1 = id1.toString();
    const strId2 = id2.toString();
    return strId1 === strId2;
  } catch (err) {
    console.error("Error comparing MongoDB IDs:", err);
    return false;
  }
}

/**
 * Generate a random MongoDB ObjectId (useful for testing)
 */
export function generateRandomObjectId() {
  return new mongoose.Types.ObjectId();
}

/**
 * Debug MongoDB ID issues
 */
export function debugMongoId(id, label = "ID") {
  console.log(`[MongoDB Debug] ${label}:`, {
    value: id,
    type: typeof id,
    isObjectId: id instanceof mongoose.Types.ObjectId,
    isValid: mongoose.Types.ObjectId.isValid(id),
    toString: id ? id.toString() : null,
  });
  return id;
}
