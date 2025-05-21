import React from "react";
// import { FiDollarSign } from "react-icons/fi";

const FeaturedListings = ({ listings }) => {
  return (
    <div className="featured-listings">
      {listings.map((listing) => (
        <div key={listing.id} className="listing-item">
          <h2 className="listing-title">{listing.title}</h2>
          <span className="font-semibold text-gray-700">
            {new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            }).format(listing.price)}
          </span>
          {/* <FiDollarSign className="mr-1 text-gray-500" /> */}
          <span className="mr-1 text-gray-500 font-medium">₦</span>
        </div>
      ))}
    </div>
  );
};

export default FeaturedListings;
