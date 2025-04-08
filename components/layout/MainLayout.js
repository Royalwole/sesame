import { useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import { Toaster } from "react-hot-toast";
import SyncErrorBanner from "../ui/SyncErrorBanner";

// Export as default to match import in ListingDetail
export default function MainLayout({ children }) {
  const { syncError, refreshUserData } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" />
      <Header />

      {syncError && (
        <SyncErrorBanner error={syncError} onRetry={refreshUserData} />
      )}

      <main className="flex-grow">{children}</main>

      <Footer />
    </div>
  );
}
