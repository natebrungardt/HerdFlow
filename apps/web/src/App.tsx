import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Outlet,
  Route,
  RouterProvider,
} from "react-router-dom";
import AllCowPage from "./pages/cows/AllCowPage";
import CowDetailPage from "./pages/cows/CowDetailPage";
import Navbar from "./components/shared/Navbar";
import Dashboard from "./pages/Dashboard";
import AddCowButton from "./pages/cows/AddCow";
import RemovedCows from "./pages/cows/RemovedCows";
import AllWorkdayPage from "./pages/workdays/AllWorkdayPage";
import AddWorkdayPage from "./pages/workdays/AddWorkdayPage";
import ActiveWorkdayPage from "./pages/workdays/ActiveWorkdayPage";
import CompletedWorkdayDetailsPage from "./pages/workdays/CompletedWorkdayDetailsPage";
import CompletedWorkdays from "./pages/workdays/CompletedWorkdays";
import WorkdayPage from "./pages/workdays/WorkdayPage";
import Finances from "./pages/Finances";
import { ThemeProvider } from "./context/ThemeContext";
import { UnsavedChangesProvider } from "./context/UnsavedChangesContext";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";
import { useContext, useMemo } from "react";
import { AuthContext } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";

function AuthenticatedAppLayout() {
  return (
    <UnsavedChangesProvider>
      <Navbar />
      <Outlet />
    </UnsavedChangesProvider>
  );
}

function App() {
  const { user, loading, isPasswordRecovery } = useContext(AuthContext);
  const publicRouter = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="*"
              element={
                isPasswordRecovery ? (
                  <Navigate to="/reset-password" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
          </>,
        ),
      ),
    [isPasswordRecovery],
  );
  const passwordRecoveryRouter = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/reset-password" replace />} />
          </>,
        ),
      ),
    [],
  );
  const authenticatedRouter = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <Route element={<AuthenticatedAppLayout />}>
            <Route path="/auth" element={<Navigate to="/" replace />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/cows" element={<AllCowPage />} />
            <Route path="/cows/:id" element={<CowDetailPage />} />
            <Route path="/add-cow" element={<AddCowButton />} />
            <Route
              path="/account-settings"
              element={<AccountSettingsPage />}
            />
            <Route path="/removed" element={<RemovedCows />} />
            <Route path="/workdays" element={<AllWorkdayPage />} />
            <Route path="/workdays/new" element={<AddWorkdayPage />} />
            <Route path="/workdays/:id" element={<WorkdayPage />} />
            <Route path="/workdays/:id/active" element={<ActiveWorkdayPage />} />
            <Route path="/workdays/completed" element={<CompletedWorkdays />} />
            <Route
              path="/completed-workdays/:id"
              element={<CompletedWorkdayDetailsPage />}
            />
            <Route path="/finances" element={<Finances />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>,
        ),
      ),
    [],
  );

  // Prevent flashing before auth resolves
  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  // If NOT logged in → only show auth page
  if (!user) {
    return (
      <ThemeProvider forcedTheme="light">
        <RouterProvider router={publicRouter} />
      </ThemeProvider>
    );
  }

  if (isPasswordRecovery) {
    return (
      <ThemeProvider forcedTheme="light">
        <RouterProvider router={passwordRecoveryRouter} />
      </ThemeProvider>
    );
  }

  // If logged in → show full app
  return (
    <ThemeProvider>
      <RouterProvider router={authenticatedRouter} />
    </ThemeProvider>
  );
}

export default App;
