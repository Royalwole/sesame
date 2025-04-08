import { connectDB, disconnectDB } from "../../../lib/db";
import Listing from "../../../models/Listing";
import mongoose from "mongoose";

export default async function handler(req, res) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({ error: "Development only endpoint" });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let dbConnection = false;

  try {
    await connectDB();
    dbConnection = true;

    // Create dummy user ID for testing
    const dummyUserId = new mongoose.Types.ObjectId();

    // Get data from request
    const listingData = {
      ...req.body,
      createdBy: dummyUserId,
      // Convert numeric fields to numbers
      price: Number(req.body.price),
      bedrooms: Number(req.body.bedrooms || 0),
      bathrooms: Number(req.body.bathrooms || 0),
      // Parse features
      features: req.body.features
        ? req.body.features.split(",").map((f) => f.trim())
        : [],
      // Add dummy image
      images: [
        {
          url: "https://example.com/placeholder.jpg",
          caption: "",
          isPrimary: true,
        },
      ],
    };

    // Manual validation
    const validationErrors = [];

    // Check required string fields
    [
      "title",
      "description",
      "propertyType",
      "listingType",
      "address",
      "city",
      "state",
    ].forEach((field) => {
      if (!listingData[field] || String(listingData[field]).trim() === "") {
        validationErrors.push({ field, message: `${field} is required` });
      }
    });

    // Check price
    if (isNaN(listingData.price) || listingData.price <= 0) {
      validationErrors.push({
        field: "price",
        message: "Price must be a positive number",
      });
    }

    // Check if propertyType is valid
    if (
      !["house", "apartment", "land", "commercial", "other"].includes(
        listingData.propertyType
      )
    ) {
      validationErrors.push({
        field: "propertyType",
        message: "Invalid property type",
      });
    }

    // Check if listingType is valid
    if (!["sale", "rent", "shortlet"].includes(listingData.listingType)) {
      validationErrors.push({
        field: "listingType",
        message: "Invalid listing type",
      });
    }

    // Return validation errors if any
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        details: validationErrors,
      });
    }

    // Create a listing instance to test mongoose validation
    const listing = new Listing(listingData);

    try {
      // Run validation without saving to database
      await listing.validate();

      return res.status(200).json({
        success: true,
        message: "Listing data is valid",
        data: {
          title: listing.title,
          price: listing.price,
          propertyType: listing.propertyType,
          listingType: listing.listingType,
        },
      });
    } catch (validationError) {
      console.log("Mongoose validation error:", validationError);

      // Format mongoose validation errors
      const formattedErrors = [];
      if (validationError.errors) {
        for (const field in validationError.errors) {
          formattedErrors.push({
            field,
            message: validationError.errors[field].message,
            kind: validationError.errors[field].kind,
          });
        }
      }

      return res.status(400).json({
        success: false,
        message: "Mongoose validation failed",
        details: formattedErrors,
      });
    }
  } catch (error) {
    console.error("Error validating listing:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message,
    });
  } finally {
    if (dbConnection) {
      await disconnectDB();
    }
  }
}
