import React from 'react';
import Link from 'next/link';

export default function AgentDashboard({ agent, listings = [], inspections = [] }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Agent Dashboard</h1>
      
      <section className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Your Profile</h2>
        {agent ? (
          <div>
            <p>Name: {agent.name}</p>
            <p>Email: {agent.email}</p>
            <p>Status: {agent.approved ? 'Approved' : 'Pending Approval'}</p>
          </div>
        ) : (
          <p>Loading agent information...</p>
        )}
      </section>

      <section className="bg-white p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Your Listings</h2>
          <Link 
            href="/listings/create" 
            className="bg-wine text-white px-4 py-2 rounded hover:bg-wine-dark"
          >
            Add New Listing
          </Link>
        </div>
        
        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map(listing => (
              <div key={listing._id} className="border rounded p-3">
                <h3>{listing.title}</h3>
                <p>{listing.formattedPrice}</p>
                <p>Status: {listing.status}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>You don't have any listings yet.</p>
        )}
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Inspection Requests</h2>
        {inspections.length > 0 ? (
          <ul className="space-y-2">
            {inspections.map(inspection => (
              <li key={inspection._id} className="border-b pb-2">
                <p>Property: {inspection.listing?.title || 'Unnamed property'}</p>
                <p>Requested by: {inspection.user?.name || 'Unknown user'}</p>
                <p>Date: {new Date(inspection.date).toLocaleDateString()}</p>
                <p>Status: {inspection.status}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>You don't have any inspection requests.</p>
        )}
      </section>
    </div>
  );
}
