import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
    default: "",
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
});

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Property description is required"],
      trim: true,
    },
    propertyType: {
      type: String,
      required: [true, "Property type is required"],
      enum: {
        values: ["house", "apartment", "land", "commercial", "other"],
        message: "Invalid property type selected",
      },
    },
    listingType: {
      type: String,
      required: [true, "Listing type is required"],
      enum: {
        values: ["sale", "rent", "shortlet"],
        message: "Invalid listing type selected",
      },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [1, "Price must be greater than 0"],
    },
    bedrooms: {
      type: Number,
      default: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
    },
    features: [String],
    address: {
      type: String,
      required: [true, "Property address is required"],
      trim: true,
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },
    country: {
      type: String,
      default: "Nigeria",
    },
    images: [imageSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Listing must be associated with an agent"],
    },
    status: {
      type: String,
      enum: ["draft", "pending", "published", "archived"],
      default: "published",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validation middleware to optimize validation
listingSchema.pre("validate", function (next) {
  try {
    // Apply data cleaning/normalization
    console.log(
      "Running pre-validate hook for listing:",
      this._id || "new listing"
    );

    // Ensure string fields are properly trimmed
    if (typeof this.title === "string") this.title = this.title.trim();
    if (typeof this.description === "string")
      this.description = this.description.trim();
    if (typeof this.address === "string") this.address = this.address.trim();
    if (typeof this.city === "string") this.city = this.city.trim();
    if (typeof this.state === "string") this.state = this.state.trim();
    if (typeof this.country === "string")
      this.country = this.country.trim() || "Nigeria";

    // Ensure numeric fields are proper numbers
    if (this.price !== undefined) {
      const price = Number(this.price);
      this.price = isNaN(price) ? 0 : price;
    }

    if (this.bedrooms !== undefined) {
      const bedrooms = Number(this.bedrooms);
      this.bedrooms = isNaN(bedrooms) ? 0 : Math.max(0, Math.round(bedrooms));
    }

    if (this.bathrooms !== undefined) {
      const bathrooms = Number(this.bathrooms);
      this.bathrooms = isNaN(bathrooms)
        ? 0
        : Math.max(0, Math.round(bathrooms));
    }

    // Ensure features is an array
    if (!Array.isArray(this.features)) {
      this.features = [];
    }

    next();
  } catch (error) {
    console.error("Error in listing pre-validate hook:", error);
    next(error);
  }
});

// Add a post-validation error handler to provide better error messages
listingSchema.post("validate", function (error, _, next) {
  if (error.name === "ValidationError") {
    console.log("Listing validation failed:", error.message);

    // You could modify the error here to make it more user-friendly
    // for (const field in error.errors) {
    //   const err = error.errors[field];
    //   // Process error if needed
    // }
  }

  next(error);
});

// Create text index for search
listingSchema.index({
  title: "text",
  description: "text",
  address: "text",
  city: "text",
  state: "text",
});

// Add a specific index for _id for better performance
listingSchema.index({ _id: 1 });

// Handle cases where the model might already be compiled
const Listing =
  mongoose.models.Listing || mongoose.model("Listing", listingSchema);

export default Listing;
