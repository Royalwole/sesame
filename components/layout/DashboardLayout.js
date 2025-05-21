import Dashboard from "./Dashboard";

/**
 * DashboardLayout is a wrapper around the Dashboard component
 * Created to maintain backward compatibility with imports
 */
export default function DashboardLayout({ children, title }) {
  return <Dashboard title={title}>{children}</Dashboard>;
}
