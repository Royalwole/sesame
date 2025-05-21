import React from "react";
// import { FiDollarSign } from "react-icons/fi";

const PropertyHighlights = ({ property }) => {
  // Replace any instances of dollar icon with Naira symbol
  // FROM: <FiDollarSign className="text-lg text-gray-600 mr-1" />
  // TO:
  const nairaSymbol = (
    <span className="text-lg text-gray-600 mr-1 font-medium">₦</span>
  );

  // Also ensure price formatting uses NGN currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="property-highlights">
      <div className="highlight">
        {nairaSymbol}
        {formatPrice(property.price)}
      </div>
      {/* ...other highlights... */}
    </div>
  );
};

export default PropertyHighlights;
