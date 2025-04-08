import Head from "next/head";
import PropTypes from "prop-types";

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
}) {
  // Build full title with brand
  const fullTitle = title
    ? `${title} | TopDial`
    : "TopDial - Premium Property Listings";

  // Default description if not provided
  const metaDescription =
    description ||
    "Find your dream property with TopDial, your trusted property listing platform.";

  // Current URL for canonical
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://topdial.com";
  const canonicalUrl = canonical ? `${siteUrl}${canonical}` : siteUrl;

  // Default OG image
  const ogImageUrl = ogImage || `${siteUrl}/images/topdial-social-image.jpg`;

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      {canonical && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={ogImageUrl} />

      {/* Additional SEO */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, shrink-to-fit=no"
      />
      <meta name="format-detection" content="telephone=no" />
      <meta name="theme-color" content="#722f37" />
    </Head>
  );
}

// Fix: Add prop types to prevent warnings
SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonical: PropTypes.string,
  ogImage: PropTypes.string,
  ogType: PropTypes.string,
};
