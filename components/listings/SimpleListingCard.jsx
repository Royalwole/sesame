import React, { memo, useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import PropTypes from "prop-types";
import { useInView } from "react-intersection-observer";
import { FiHome, FiBed, FiBath, FiSquare, FiHeart, FiMapPin, FiClock, FiAlertTriangle, FiImage } from "react-icons/fi";

// Simple version of ListingCard for testing
const ListingCard = memo(function ListingCard({ listing, onClick, preloadImages = false, size = "default" }) {
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
ListingCard.displayName = 'ListingCard';

ListingCard.propTypes = {
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

export default ListingCard;
