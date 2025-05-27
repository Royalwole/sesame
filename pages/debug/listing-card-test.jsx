import React from 'react';
import ListingCard from '../../components/listings/ListingCard';

export default function ListingCardTest() {
  // Mock data for testing
  const mockListing = {
    _id: "test123",
    title: "Test Property",
    price: 25000000,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1200,
    images: ["/uploads/sample.jpg"],
    status: "for_sale",
    createdAt: new Date().toISOString(),
    propertyType: "residential",
    location: {
      city: "Lagos",
      state: "Lagos",
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Listing Card Test</h1>
      <div className="w-96">
        <ListingCard listing={mockListing} />
      </div>
    </div>
  );
}
