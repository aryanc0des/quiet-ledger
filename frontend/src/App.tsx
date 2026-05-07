import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "@/store/AppContext";
import { Layout } from "@/components/Layout";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { CalendarPage } from "@/pages/CalendarView";
import { SettingsPage } from "@/pages/Settings";
import { PageLoader } from "@/components/States";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useApp();

  // Still resolving session from localStorage
  if (state.authLoading) return <PageLoader />;

  // Not logged in → redirect to login
  if (!state.user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/calendar"
        element={
          <RequireAuth>
            <CalendarPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
