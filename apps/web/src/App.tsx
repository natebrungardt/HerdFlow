import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AllCowPage from "./pages/cows/AllCowPage";
import CowDetailPage from "./pages/cows/CowDetailPage";
import Navbar from "./components/shared/Navbar";
import Dashboard from "./pages/Dashboard";
import AddCowButton from "./pages/cows/AddCow";
import RemovedCows from "./pages/cows/RemovedCows";
import AllWorkdayPage from "./pages/workdays/AllWorkdayPage";
import AddWorkdayPage from "./pages/workdays/AddWorkdayPage";
import WorkdayPage from "./pages/workdays/WorkdayPage";
import RemovedWorkdays from "./pages/workdays/RemovedWorkdays";
import Finances from "./pages/Finances";
import { PendingWorkdaySelectionProvider } from "./context/PendingWorkdaySelectionContext";
import { ThemeProvider } from "./context/ThemeContext";
import AuthPage from "./pages/AuthPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

function App() {
  const { user, loading, isPasswordRecovery } = useContext(AuthContext);

  // Prevent flashing before auth resolves
  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  // If NOT logged in → only show auth page
  if (!user) {
    return (
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="*"
              element={
                isPasswordRecovery ? (
                  <Navigate to="/reset-password" replace />
                ) : (
                  <AuthPage />
                )
              }
            />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  if (isPasswordRecovery) {
    return (
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<Navigate to="/reset-password" replace />} />
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    );
  }

  // If logged in → show full app
  return (
    <ThemeProvider>
      <BrowserRouter>
        <PendingWorkdaySelectionProvider>
          <Navbar />
          <Routes>
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="/cows" element={<AllCowPage />} />
            <Route path="/cows/:id" element={<CowDetailPage />} />
            <Route path="/add-cow" element={<AddCowButton />} />
            <Route path="/removed" element={<RemovedCows />} />
            <Route path="/workdays" element={<AllWorkdayPage />} />
            <Route path="/workdays/new" element={<AddWorkdayPage />} />
            <Route path="/workdays/:id" element={<WorkdayPage />} />
            <Route path="/workdays/removed" element={<RemovedWorkdays />} />
            <Route path="/finances" element={<Finances />} />
          </Routes>
        </PendingWorkdaySelectionProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
