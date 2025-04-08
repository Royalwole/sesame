import React from 'react';
import Link from 'next/link';

export default function AdminDashboard({ users = [], pendingAgents = [], pendingListings = [] }) {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <section className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Site Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded">
            <h3 className="font-semibold">Total Users</h3>
            <p className="text-2xl">{users.length}</p>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-semibold">Pending Agents</h3>
            <p className="text-2xl">{pendingAgents.length}</p>
          </div>
          <div className="border p-4 rounded">
            <h3 className="font-semibold">Pending Listings</h3>
            <p className="text-2xl">{pendingListings.length}</p>
          </div>
        </div>
      </section>

      <section className="bg-white p-4 rounded shadow mb-6">
        <h2 className="text-xl font-semibold mb-3">Pending Agent Approvals</h2>
        {pendingAgents.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Email</th>
                <th className="text-left p-2">Registered</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingAgents.map(agent => (
                <tr key={agent._id} className="border-b">
                  <td className="p-2">{agent.name}</td>
                  <td className="p-2">{agent.email}</td>
                  <td className="p-2">{new Date(agent.created_at).toLocaleDateString()}</td>
                  <td className="p-2 space-x-2">
                    <button className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                      Approve
                    </button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending agent approvals.</p>
        )}
      </section>

      <section className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">Pending Listings</h2>
        {pendingListings.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Title</th>
                <th className="text-left p-2">Agent</th>
                <th className="text-left p-2">Price</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingListings.map(listing => (
                <tr key={listing._id} className="border-b">
                  <td className="p-2">{listing.title}</td>
                  <td className="p-2">{listing.agent?.name || 'Unknown'}</td>
                  <td className="p-2">{listing.formattedPrice}</td>
                  <td className="p-2 space-x-2">
                    <button className="bg-green-500 text-white px-2 py-1 rounded text-sm">
                      Approve
                    </button>
                    <button className="bg-yellow-500 text-white px-2 py-1 rounded text-sm">
                      Review
                    </button>
                    <button className="bg-red-500 text-white px-2 py-1 rounded text-sm">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No pending listings to approve.</p>
        )}
      </section>
    </div>
  );
}
