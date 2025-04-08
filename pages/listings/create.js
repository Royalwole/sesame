import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import CreateListingForm from '../../components/listings/CreateListingForm';
import Loader from '../../components/utils/Loader';
import { useAuth } from '../../contexts/AuthContext';

export default function CreateListingPage() {
  const router = useRouter();
  const { isSignedIn, isLoading: authLoading, hasRole } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Check if user is authenticated and has the correct role
  useEffect(() => {
    if (!authLoading) {
      if (!isSignedIn) {
        router.push('/sign-in?redirect=/listings/create');
      } else if (!hasRole(['agent', 'admin'])) {
        toast.error('Only agents can create listings');
        router.push('/dashboard');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [authLoading, isSignedIn, hasRole, router]);
  
  if (authLoading || !isAuthorized) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader size="large" />
      </div>
    );
  }
  
  return (
    <>
      <Head>
        <title>Create New Listing | TopDial</title>
      </Head>
      
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Create New Listing</h1>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <CreateListingForm />
        </div>
      </div>
    </>
  );
}
