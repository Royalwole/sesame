// Ultra-simple static HTML for emergency fix with no React dependencies
export default function UltraSimpleFix() {
  return (
    <html>
      <head>
        <title>Emergency Dashboard Fix</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          {`
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', sans-serif; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 40px auto; padding: 0 20px; }
          .card { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { margin: 0 0 24px; font-size: 24px; font-weight: bold; color: #333; text-align: center; }
          .btn { display: block; width: 100%; padding: 12px; margin: 12px 0; text-align: center; background-color: #3B82F6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 500; cursor: pointer; text-decoration: none; }
          .btn:hover { background-color: #2563EB; }
          .btn-green { background-color: #10B981; }
          .btn-green:hover { background-color: #059669; }
          .btn-red { background-color: #EF4444; }
          .btn-red:hover { background-color: #DC2626; }
          .btn-gray { background-color: #6B7280; }
          .btn-gray:hover { background-color: #4B5563; }
          .warning { background-color: #FFFBEB; border: 1px solid #FEF3C7; padding: 16px; border-radius: 6px; margin-bottom: 20px; }
          .links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info { font-size: 14px; color: #666; margin-top: 20px; text-align: center; }
          `}
        </style>
      </head>
      <body>
        <div className="container">
          <div className="card">
            <h1 className="header">Ultra Simple Dashboard Fix</h1>
            <div className="warning">
              <p>
                <strong>Having trouble with endless loading or errors?</strong>
              </p>
              <p>
                This page uses direct form submission (no JavaScript) to fix
                your account.
              </p>
            </div>{" "}
            <form
              action="/api/direct-fix"
              method="post"
              onSubmit={(e) => {
                // Only allow submission when button is explicitly clicked
                if (
                  e.nativeEvent.submitter !== e.target.querySelector("button")
                ) {
                  e.preventDefault();
                }
              }}
            >
              <button type="submit" className="btn btn-red">
                Fix My Account (Direct)
              </button>
            </form>
            <p
              style={{
                marginTop: "20px",
                marginBottom: "10px",
                textAlign: "center",
              }}
            >
              Other options:
            </p>
            <div className="links">
              <a href="/dashboard/user?breakLoop=true" className="btn btn-gray">
                User Dashboard
              </a>
              <a
                href="/dashboard/agent?breakLoop=true"
                className="btn btn-gray"
              >
                Agent Dashboard
              </a>
              <a href="/auth/sign-in" className="btn btn-gray">
                Sign In
              </a>
              <a href="/auth/sign-out" className="btn btn-gray">
                Sign Out
              </a>
            </div>
            <div className="info">
              <p>
                This page doesn't use any JavaScript and should work even if
                other pages are broken.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
