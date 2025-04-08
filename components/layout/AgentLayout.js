import React from "react";
import Head from "next/head";
import AgentHeader from "../header/AgentHeader";
import AgentSidebar from "../sidebar/AgentSidebar";
import Footer from "../footer/Footer";

export default function Layout({ children, title = "Agent Dashboard" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title} - TopDial</title>
      </Head>

      {/* Agent Header */}
      <AgentHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AgentSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {children}

          {/* Footer */}
          <Footer />
        </main>
      </div>
    </div>
  );
}
