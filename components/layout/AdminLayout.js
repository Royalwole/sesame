import React from "react";
import Head from "next/head";
import Header from "../header/Header";
import Footer from "../footer/Footer";

export default function AdminLayout({ children, title = "Admin Dashboard" }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title} | TopDial</title>
      </Head>

      {/* Common Header */}
      <Header />

      <main className="flex-grow">{children}</main>

      {/* Common Footer */}
      <Footer />
    </div>
  );
}
