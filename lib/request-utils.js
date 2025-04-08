/**
 * Safely get a header value from a request object
 * Works reliably in different Node.js environments
 */
export function getRequestHeader(req, name) {
  if (!req || !name) {
    return undefined;
  }

  // Try standard headers object first
  if (req.headers) {
    // Try exact case
    if (req.headers[name] !== undefined) {
      return req.headers[name];
    }

    // Try lowercase (most HTTP headers are case-insensitive)
    const lowercaseName = name.toLowerCase();
    if (req.headers[lowercaseName] !== undefined) {
      return req.headers[lowercaseName];
    }

    // In some environments, Headers object has a get method
    if (typeof req.headers.get === "function") {
      return req.headers.get(name) || undefined;
    }
  }

  // Special case for Next.js in certain environments
  try {
    if (
      req.socket &&
      req.socket._httpMessage &&
      typeof req.socket._httpMessage.getHeader === "function"
    ) {
      return req.socket._httpMessage.getHeader(name);
    }
  } catch (e) {
    console.warn("Failed to access header from socket:", e);
  }

  return undefined;
}

/**
 * Extract cookie value safely from request
 */
export function getRequestCookie(req, name) {
  if (!req || !name) {
    return undefined;
  }

  // Get Cookie header
  const cookies = getRequestHeader(req, "cookie");
  if (!cookies) {
    return undefined;
  }

  // Parse cookies and find the named one
  const cookieRegex = new RegExp(`(^|;\\s*)${name}=([^;]*)`);
  const match = cookies.match(cookieRegex);

  return match ? decodeURIComponent(match[2]) : undefined;
}
