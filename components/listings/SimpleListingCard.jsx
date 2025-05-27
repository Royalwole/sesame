import React, { memo } from "react";
import Link from "next/link";
import PropTypes from "prop-types";

// Simple version of ListingCard for testing
const SimpleListingCard = memo(function SimpleListingCard({ listing, onClick, preloadImages = false, size = "default" }) {
  if (!listing) {
    return <div>No listing data</div>;
  }

  const { 
    _id, 
    title = "Untitled Property",
    price = 0,
    location = {},
    images = []
  } = listing;

  // Simplified card
  return (
    <Link href={`/listings/${_id}`} passHref>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-medium">{title}</h3>
        <p>₦{price.toLocaleString()}</p>
        <p>{location.city}, {location.state}</p>
      </div>
    </Link>
  );
});

// Add displayName for better debugging
SimpleListingCard.displayName = 'SimpleListingCard';

SimpleListingCard.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    price: PropTypes.number,
    location: PropTypes.shape({
      city: PropTypes.string,
      state: PropTypes.string
    })
  }).isRequired,
  onClick: PropTypes.func,
  preloadImages: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'default', 'large'])
};

export default SimpleListingCard;
