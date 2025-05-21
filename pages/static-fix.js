// Static HTML page that will load even if there are JavaScript errors
import { getAuth } from "@clerk/nextjs/server";

export default function StaticEmergencyPage({ userId }) {
  return (
    <html>
      <head>
        <title>Static Emergency Dashboard Fix</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
            color: #1f2937;
          }
          .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 40px 20px;
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
            text-align: center;
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
            margin: 8px 0;
            text-align: center;
          }
          .button-red {
            background-color: #dc2626;
          }
          .button:hover {
            opacity: 0.9;
          }
          .button-full {
            display: block;
            width: 100%;
          }
          .button-group {
            display: flex;
            gap: 10px;
            margin-top: 16px;
          }
          .button-group .button {
            flex: 1;
          }
          .divider {
            height: 1px;
            background-color: #e5e7eb;
            margin: 20px 0;
          }
          .info {
            margin-bottom: 20px;
            font-size: 14px;
          }
          .info-label {
            font-weight: 600;
            margin-right: 4px;
          }
        `,
          }}
        />
      </head>
      <body>
        <div className="container">
          <div className="box">
            <h1 className="header">Static Emergency Fix</h1>

            <div className="alert">
              <strong>Warning:</strong> This is a static emergency fix page. Use
              this if you're experiencing issues with the regular dashboard
              access or other fix tools.
            </div>

            <div className="info">
              <p>
                <span className="info-label">User ID:</span>{" "}
                {userId || "Not signed in"}
              </p>
            </div>

            <a
              href="/api/static-emergency-fix"
              className="button button-red button-full"
            >
              Apply Emergency Fix
            </a>

            <div className="divider"></div>

            <div className="button-group">
              <a href="/auth/sign-in" className="button">
                Sign In
              </a>
              <a href="/auth/sign-out" className="button">
                Sign Out
              </a>
            </div>

            <div className="button-group">
              <a href="/dashboard/user?breakLoop=true" className="button">
                User Dashboard
              </a>
              <a href="/dashboard/agent?breakLoop=true" className="button">
                Agent Dashboard
              </a>
            </div>

            <div className="divider"></div>

            <div
              style={{
                fontSize: "14px",
                color: "#6b7280",
                textAlign: "center",
              }}
            >
              This is a static emergency fix page that works even if JavaScript
              is disabled.
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

export async function getServerSideProps(context) {
  const { userId } = getAuth(context.req);

  return {
    props: {
      userId: userId || null,
    },
  };
}
