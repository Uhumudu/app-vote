// src/components/MaintenanceGuard.jsx
import { useLocation } from "react-router-dom";
import { usePlatformConfig } from "../context/PlatformConfigContext";
import MaintenancePage from "../pages/publics/MaintenancePage";

const EXEMPT_PATHS = [
  "/login",
  "/superAdminDashboard",
  "/superadmin",
  "/super-admin",
  "/admin/superadmin/parametres",
];

export default function MaintenanceGuard({ children }) {
  const { config, loaded } = usePlatformConfig();
  const location = useLocation();

  if (!loaded) return null;

  const isExempt = EXEMPT_PATHS.some((p) =>
    location.pathname.toLowerCase().startsWith(p.toLowerCase())
  );

  if (config.maintenance && !isExempt) {
    return <MaintenancePage />;
  }

  return children;
}
