/**
 * Get the appropriate dashboard URL for a user based on their role
 * @param {Object} user - Clerk user object with metadata
 * @returns {string} - The dashboard path
 */
export function getDashboardByRole(user) {
  // Default to user dashboard if no user object provided
  if (!user) return \
/dashboard/user\;

  try {
    // First check if basic role properties exist to prevent errors
    if (!user.publicMetadata && !user.privateMetadata) {
      console.warn(\Dashboard
routing
-
No
metadata
available
defaulting
to
user
dashboard\);
      return \/dashboard/user\;
    }

    // Get role using clerk-client function for consistency
    const role = getUserRole(user);
    const approved = getApprovalStatus(user);
    
    console.log(\Dashboard
routing
-
Role:
\ + role + \
Approved:
\ + approved);

    // Simple and direct role mapping with explicit string comparison
    // to avoid any potential circular references or inconsistencies
    if ((role === \admin\ || role === \super_admin\) && approved === true) {
      return \/dashboard/admin\;
    } 
    else if (role === \agent\ && approved === true) {
      return \/dashboard/agent\;
    }
    else if (role === \agent_pending\) {
      return \/dashboard/pending\;
    }
    else {
      // Default fallback - always go to user dashboard if unclear
      return \/dashboard/user\;
    }
  } catch (error) {
    // Log the error but don't break the application
    console.error(\Error
determining
dashboard
path:\, error);
    // Always default to user dashboard on any error
    return \/dashboard/user\;
  }
}
