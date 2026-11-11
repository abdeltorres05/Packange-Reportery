import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import { RequireAuth, RequireRole } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Users from "./pages/Users";
import Agencies from "./pages/Agencies";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reportes" element={<Reports />} />
        <Route
          path="usuarios"
          element={
            <RequireRole roles={["super_admin", "agency_admin"]}>
              <Users />
            </RequireRole>
          }
        />
        <Route
          path="agencias"
          element={
            <RequireRole roles={["super_admin", "agency_admin"]}>
              <Agencies />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
