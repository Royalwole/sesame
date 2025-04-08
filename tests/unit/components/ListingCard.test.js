import React from 'react';
import { render, screen } from '@testing-library/react';
import ListingCard from '../../../components/listings/ListingCard';

// Sample listing data for tests
const mockListing = {
  _id: 'listing123',
  title: 'Test Property',
  price: 250000,
  location: {
    city: 'Lagos',
    state: 'Lagos',
  },
  bedrooms: 3,
  bathrooms: 2,
  squareFeet: 1500,
  images: ['/images/sample-property-1.jpg'],
  type: 'apartment',
};

// Mock next/link to prevent Link usage errors
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe('ListingCard Component', () => {
  it('renders properly with all listing information', () => {
    render(<ListingCard listing={mockListing} />);
    
    // Check if title is rendered
    expect(screen.getByText('Test Property')).toBeInTheDocument();
    
    // Check if price is formatted correctly
    expect(screen.getByText('$250,000')).toBeInTheDocument();
    
    // Check if location is rendered
    expect(screen.getByText('Lagos, Lagos')).toBeInTheDocument();
    
    // Check if features are rendered
    expect(screen.getByText('3 beds')).toBeInTheDocument();
    expect(screen.getByText('2 baths')).toBeInTheDocument();
    expect(screen.getByText('1,500 ft²')).toBeInTheDocument();
  });
  
  it('handles missing data gracefully', () => {
    const incompleteData = {
      _id: 'listing456',
      title: 'Incomplete Listing',
      price: 0,
    };
    
    render(<ListingCard listing={incompleteData} />);
    
    // Check if title is rendered
    expect(screen.getByText('Incomplete Listing')).toBeInTheDocument();
    
    // Check if price is handled
    expect(screen.getByText('$0')).toBeInTheDocument();
    
    // Check if missing location is handled
    expect(screen.getByText('Location unavailable')).toBeInTheDocument();
  });
  
  it('should not render when listing is null', () => {
    const { container } = render(<ListingCard listing={null} />);
    expect(container.firstChild).toBeNull();
  });
});
