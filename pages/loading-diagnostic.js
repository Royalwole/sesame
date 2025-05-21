// Zero-JavaScript diagnostic page that should load regardless of issues
import { clerkClient, getAuth } from "@clerk/nextjs/server";

export default function LoadingDiagnosticPage({
  error,
  userDetails,
  dashboardUrls,
}) {
  return (
    <html>
      <head>
        <title>Dashboard Loading Diagnostic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 20px;
            background-color: #f3f4f6;
            color: #1f2937;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          .box {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            padding: 24px;
            margin-bottom: 24px;
          }
          .alert {
            background-color: #fee2e2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 20px;
            color: #b91c1c;
          }
          .header {
            margin: 0 0 24px 0;
            font-size: 24px;
            font-weight: bold;
            color: #111827;
          }
          .section-header {
            margin: 24px 0 16px;
            font-size: 18px;
            font-weight: bold;
            color: #374151;
          }
          .code {
            font-family: monospace;
            background-color: #f3f4f6;
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            border: none;
            border-radius: 6px;
            padding: 10px 16px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            text-decoration: none;
            margin: 8px 8px 8px 0;
          }
          .button-red {
            background-color: #dc2626;
          }
          .button-green {
            background-color: #10b981;
          }
          .button:hover {
            opacity: 0.9;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
          @media (max-width: 640px) {
            .grid {
              grid-template-columns: 1fr;
            }
          }
          .info-label {
            font-weight: 600;
            margin-right: 4px;
          }
          .info-value {
            font-family: monospace;
          }
          .buttons-container {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 16px;
          }
        `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="box">
            <h1 className="header">Dashboard Loading Diagnostic</h1>

            {error && (
              <div className="alert">
                <strong>Error detected:</strong> {error}
              </div>
            )}

            <div>
              <p>
                This page performs server-side diagnostics to help identify why
                your dashboard might be loading endlessly.
              </p>

              {userDetails ? (
                <>
                  <h2 className="section-header">User Information</h2>
                  <div>
                    <p>
                      <span className="info-label">User ID:</span>{" "}
                      <span className="info-value">{userDetails.id}</span>
                    </p>
                    <p>
                      <span className="info-label">Name:</span>{" "}
                      {userDetails.firstName} {userDetails.lastName}
                    </p>
                    <p>
                      <span className="info-label">Email:</span>{" "}
                      {userDetails.email}
                    </p>
                    <p>
                      <span className="info-label">Role:</span>{" "}
                      <span className="info-value">
                        {userDetails.role || "No role set"}
                      </span>
                    </p>
                    <p>
                      <span className="info-label">Approved:</span>{" "}
                      <span className="info-value">
                        {userDetails.approved ? "Yes" : "No"}
                      </span>
                    </p>
                  </div>

                  <h2 className="section-header">Diagnostic Results</h2>
                  <div>
                    {!userDetails.role ? (
                      <p className="alert">
                        You don't have any role set. This will cause permission
                        issues.
                      </p>
                    ) : userDetails.role !== "agent" ? (
                      <p className="alert">
                        Your role is set to "{userDetails.role}" instead of
                        "agent".
                      </p>
                    ) : !userDetails.approved ? (
                      <p className="alert">
                        You have the correct "agent" role but your account is
                        not approved.
                      </p>
                    ) : (
                      <p style={{ color: "green" }}>
                        ✓ Your account role and approval status look correct.
                      </p>
                    )}

                    <div className="divider"></div>

                    <h2 className="section-header">Recommended Actions</h2>
                    <div className="buttons-container">
                      <a
                        href="/api/static-emergency-fix"
                        className="button button-red"
                      >
                        Apply Emergency Fix
                      </a>
                      <a href="/static-fix" className="button">
                        Go to Static Fix Page
                      </a>
                      <a href="/bypass-agent" className="button button-green">
                        Bypass Agent Dashboard
                      </a>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    You are not signed in. Please sign in to diagnose your
                    dashboard issues.
                  </p>
                  <a
                    href="/auth/sign-in?redirect_url=/loading-diagnostic"
                    className="button"
                  >
                    Sign In
                  </a>
                </>
              )}
            </div>

            <div className="divider"></div>

            <h2 className="section-header">Dashboard Links</h2>
            <div className="grid">
              {dashboardUrls.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  className="box"
                  style={{
                    margin: "8px 0",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  <h3 style={{ margin: "0 0 8px 0" }}>{item.name}</h3>
                  <p
                    style={{ margin: "0", fontSize: "14px", color: "#4b5563" }}
                  >
                    {item.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

export async function getServerSideProps(context) {
  const { userId } = getAuth(context.req);

  let userDetails = null;
  let error = null;

  try {
    if (userId) {
      const user = await clerkClient.users.getUser(userId);

      userDetails = {
        id: user.id,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.emailAddresses[0]?.emailAddress || "",
        role: user.publicMetadata?.role || null,
        approved: !!user.publicMetadata?.approved,
      };
    }
  } catch (err) {
    console.error("Error fetching user details:", err);
    error = err.message;
  }

  // Create a list of dashboard URLs to try
  const dashboardUrls = [
    {
      name: "Agent Dashboard (Safe Mode)",
      url: "/dashboard/agent?breakLoop=true&t=" + Date.now(),
      description: "Access the agent dashboard with redirect loop prevention",
    },
    {
      name: "User Dashboard",
      url: "/dashboard/user?breakLoop=true&t=" + Date.now(),
      description: "Access the regular user dashboard",
    },
    {
      name: "Emergency Fix",
      url: "/emergency-fix",
      description: "Tool to fix your agent role and approval status",
    },
    {
      name: "Simple Fix",
      url: "/simple-fix",
      description: "Simplified fix tool with minimal dependencies",
    },
    {
      name: "Static Fix",
      url: "/static-fix",
      description: "Static HTML fix page that works without JavaScript",
    },
    {
      name: "Bypass Agent Dashboard",
      url: "/bypass-agent",
      description: "Access agent dashboard while bypassing permission checks",
    },
  ];

  return {
    props: {
      userDetails,
      error,
      dashboardUrls,
    },
  };
}
