# TopDial - Property Listing Platform

## Overview

TopDial is a property listing platform built with Next.js, MongoDB, and Clerk for authentication.

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB
- Clerk account for authentication

### Environment Setup

1. Clone the repository
2. Copy the `.env.example` file to `.env.local`:
   ```
   cp .env.example .env.local
   ```
3. Update the environment variables in `.env.local`

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```bash
docker build -t topdial .
docker run -p 3000:3000 topdial
```

## Core Features

- Property listings with detailed information
- User authentication and authorization
- Agent and admin dashboards
- Search and filter capabilities
- Image uploads and management

## Deployment

### Vercel (Recommended)

This project is optimized for deployment on Vercel. Connect your repository to Vercel and set up the required environment variables.

### Alternative Deployment Options

- Docker container (see Dockerfile)
- Node.js server with PM2

## Monitoring and Analytics

- Google Analytics integration
- Health check endpoint at `/api/health`

## License

This project is licensed under the UNLICENSED license.

## Project Structure

The project follows a standard Next.js Pages Router pattern:

- `components/`: Reusable React components
- `lib/`: Utility functions and services
- `models/`: Mongoose data models
- `pages/`: Next.js pages and API routes
- `public/`: Static assets
- `styles/`: Global styles

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.


topdial-ng/
├── components/          # Reusable React components (written in JSX)
│   ├── auth/            # Authentication UI components
│   │   ├── SignIn.js    # JSX for sign-in form
│   │   └── SignUp.js    # JSX for sign-up form
│   ├── dashboard/       # Dashboard UI components
│   │   ├── UserDashboard.js   # JSX for user dashboard
│   │   ├── AgentDashboard.js  # JSX for agent dashboard
│   │   └── AdminDashboard.js  # JSX for admin dashboard
│   ├── layout/          # Layout UI components
│   │   ├── Header.js    # JSX for navigation header
│   │   └── Footer.js    # JSX for footer section
│   ├── listings/        # Listing-related UI components
│   │   ├── ListingCard.js     # JSX for individual listing display
│   │   ├── ListingDetail.js   # JSX for detailed listing view
│   │   ├── CreateListingForm.js # JSX for listing creation form
│   │   └── ImageUpload.js     # JSX for image upload UI
│   ├── ui/              # General-purpose UI components
│   │   ├── Button.js    # JSX for reusable button
│   │   ├── Input.js     # JSX for reusable input field
│   │   └── Modal.js     # JSX for reusable modal
│   └── utils/           # Utility UI components
│       ├── Loader.js    # JSX for loading spinner
│       └── ErrorMessage.js # JSX for error display
├── lib/                 # Utility functions (plain JavaScript)
│   ├── db.js            # MongoDB connection logic
│   ├── clerk.js         # Clerk utilities (e.g., role management)
│   ├── format.js        # Formatting helpers (e.g., currency)
│   └── uploadImage.js   # Image upload logic for Vercel Blob
├── models/              # Mongoose schemas (plain JavaScript)
│   ├── User.js          # User schema
│   ├── Listing.js       # Listing schema
│   ├── Favorite.js      # Favorite schema
│   └── Inspection.js    # Inspection schema
├── pages/               # Next.js pages (JSX for UI, JavaScript for API)
│   ├── api/             # API routes (plain JavaScript)
│   │   ├── listings/    # Listing API endpoints
│   │   │   ├── create.js  # Create a listing
│   │   │   ├── [id].js    # Get, update, or delete by ID
│   │   │   └── index.js   # List all listings
│   │   ├── favorites/   # Favorites API endpoints
│   │   │   ├── create.js  # Add a favorite
│   │   │   └── [id].js    # Get or delete by ID
│   │   ├── inspections/ # Inspections API endpoints
│   │   │   ├── create.js  # Schedule an inspection
│   │   │   └── [id].js    # Get, update, or delete by ID
│   │   └── admin/       # Admin API endpoints
│   │       ├── approve.js # Approve listings
│   │       └── suspend.js # Suspend users
│   ├── dashboard/       # Dashboard pages (JSX)
│   │   ├── index.js     # Redirect based on user role
│   │   ├── user.js      # User dashboard page
│   │   ├── agent.js     # Agent dashboard page
│   │   └── admin.js     # Admin dashboard page
│   ├── listings/        # Listing pages (JSX)
│   │   ├── index.js     # Listings list page
│   │   ├── [id].js      # Listing detail page
│   │   └── create.js    # Create listing page
│   ├── sign-in.js       # Sign-in page (JSX)
│   ├── sign-up.js       # Sign-up page (JSX)
│   ├── about.js         # About page (JSX)
│   ├── contact.js       # Contact page (JSX)
│   ├── terms.js         # Terms of Service page (JSX)
│   ├── privacy.js       # Privacy Policy page (JSX)
│   └── index.js         # Homepage (JSX)
├── public/              # Static assets
│   ├── images/          # Images (e.g., logo, placeholders)
│   ├── fonts/           # Custom fonts (if needed)
│   └── favicon.ico      # Favicon
├── styles/              # Styling configuration
│   └── globals.css      # Global CSS (if needed beyond Tailwind)
├── tests/               # Test files
│   ├── components/      # Component tests
│   ├── pages/           # Page tests
│   └── api/             # API route tests
├── .env.local           # Environment variables
├── tailwind.config.js   # Tailwind CSS configuration
├── next.config.js       # Next.js configuration
├── package.json         # Project dependencies and scripts
└── README.md            # Project documentation

## Storage Setup

This project uses Firebase Storage for file uploads. To set up Firebase Storage:

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Storage in your Firebase project
3. Copy your Firebase configuration from Project Settings
4. Create a `.env.local` file based on `.env.example`
5. Fill in your Firebase configuration values in `.env.local`

The following environment variables are required for Firebase Storage:
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

to generate a SCHEDULED_TASKS_API_KEY run this command on terminal

 node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"


