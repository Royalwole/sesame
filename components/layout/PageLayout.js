import Layout from "./MainLayout";
import Head from "next/head";
import Image from "next/image";

export default function PageLayout({
  children,
  title,
  description,
  heroImage,
  heroTitle,
  heroSubtitle,
}) {
  return (
    <Layout>
      <Head>
        <title>{title} | TopDial Real Estate</title>
        <meta name="description" content={description} />
      </Head>

      {/* Hero Section */}
      {heroTitle && (
        <div className="relative h-80 md:h-96 overflow-hidden">
          {heroImage && (
            <Image
              src={heroImage}
              alt={heroTitle}
              className="object-cover"
              fill
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent">
            <div className="container mx-auto px-4 h-full flex items-center">
              <div className="max-w-xl text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {heroTitle}
                </h1>
                {heroSubtitle && (
                  <p className="text-lg md:text-xl">{heroSubtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Content */}
      {children}
    </Layout>
  );
}
