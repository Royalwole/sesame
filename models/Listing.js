import mongoose from "mongoose";

// Only execute this code once
let isIndexed = false;

const ListingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    bedrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    bathrooms: {
      type: Number,
      min: 0,
      default: 0,
    },
    propertyType: {
      type: String,
      required: true,
      enum: [
        "house",
        "apartment",
        "condo",
        "villa",
        "land",
        "commercial",
        "penthouse",
        "mansion",
        "estate",
      ],
    },
    listingType: {
      type: String,
      required: true,
      enum: ["sale", "rent", "lease", "shortlet"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    country: {
      type: String,
      default: "Nigeria",
    },
    features: [String],
    images: [
      {
        url: String,
        path: String,
        filename: String,
        originalName: String,
        size: Number,
        contentType: String,
      },
    ],
    status: {
      type: String,
      enum: [
        "draft",
        "published",
        "under_review",
        "archived",
        "sold",
        "rented",
        "for_sale",
        "for_rent",
      ],
      default: "published", // Default to published for visibility
    },
    // Reference to agent
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Store just what's needed for display
    createdBy: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: String,
      email: String,
      profileImage: String,
    },
  },
  { timestamps: true }
);

// Create price formatted virtual
ListingSchema.virtual("formattedPrice").get(function () {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(this.price);
});

// Enable virtuals in JSON
ListingSchema.set("toJSON", { virtuals: true });
ListingSchema.set("toObject", { virtuals: true });

// Create indexes safely - only runs once
if (!isIndexed && mongoose.connection.readyState === 1) {
  ListingSchema.index({ status: 1, createdAt: -1 });
  ListingSchema.index({ agentId: 1 });
  ListingSchema.index({ createdAt: -1 });
  ListingSchema.index({ city: 1 });
  isIndexed = true;
}

// Use mongoose.models to prevent duplicate model registration
export default mongoose.models.Listing ||
  mongoose.model("Listing", ListingSchema);
