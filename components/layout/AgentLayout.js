import React from "react";
import Head from "next/head";
import Header from "../header/Header";
import AgentSidebar from "../sidebar/AgentSidebar";
import Footer from "../footer/Footer";

export default function AgentLayout({ children, title = "Agent Dashboard" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head>
        <title>{title} - TopDial</title>
      </Head>

      {/* Common Header */}
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AgentSidebar />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      {/* Footer - moved outside main for consistency */}
      <Footer />
    </div>
  );
}
