import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../header/Header';
import Footer from '../footer/Footer';
import AgentSidebar from '../sidebar/AgentSidebar';
import NotificationBadge from '../dashboard/NotificationBadge';

export default function AgentLayout({ children, title = 'Agent Dashboard' }) {
  const { dbUser } = useAuth();
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch('/api/agents/notifications');
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }

    if (dbUser?._id) {
      fetchNotifications();
    }
  }, [dbUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title} | TopDial</title>
      </Head>

      {/* Common Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AgentSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 mb-4">
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
              <div className="flex items-center">
                <NotificationBadge notifications={notifications} />
              </div>
            </div>
            {children}
          </div>
        </main>
      </div>

      {/* Common Footer */}
      <Footer />
    </div>
  );
}