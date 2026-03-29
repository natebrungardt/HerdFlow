import { useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePendingWorkdaySelection } from "../../context/PendingWorkdaySelectionContext";
import { useTheme } from "../../context/ThemeContext";
import Modal from "./Modal";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPendingSelections } = usePendingWorkdaySelection();
  const { theme, toggleTheme } = useTheme();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  function isActivePath(targetPath: string) {
    if (targetPath === "/") {
      return location.pathname === "/";
    }

    if (targetPath === "/cows") {
      return (
        location.pathname === "/cows" ||
        location.pathname === "/add-cow" ||
        location.pathname.startsWith("/cows/")
      );
    }

    if (targetPath === "/workdays") {
      return (
        location.pathname === "/workdays" ||
        location.pathname === "/workdays/new" ||
        (/^\/workdays\/[^/]+$/.test(location.pathname) &&
          location.pathname !== "/workdays/removed")
      );
    }

    return location.pathname === targetPath;
  }

  function handleNavbarNavigation(targetPath: string) {
    return (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        !hasPendingSelections ||
        location.pathname === targetPath ||
        !location.pathname.startsWith("/workdays/")
      ) {
        return;
      }

      event.preventDefault();
      setPendingPath(targetPath);
    };
  }

  return (
    <>
      <div className="navbar">
        <Link
          className="navbar-left"
          to="/"
          onClick={handleNavbarNavigation("/")}
        >
          <img
            className="navbar-logo"
            src="/herdflow-mark.svg"
            alt="HerdFlow logo"
          />
          HerdFlow
        </Link>
        <div className="navbar-links">
          <button className="themeToggleButton" onClick={toggleTheme}>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <Link
            className={isActivePath("/") ? "active" : undefined}
            to="/"
            onClick={handleNavbarNavigation("/")}
          >
            Dashboard
          </Link>
          <Link
            className={isActivePath("/cows") ? "active" : undefined}
            to="/cows"
            onClick={handleNavbarNavigation("/cows")}
          >
            Herd
          </Link>
          <Link
            className={isActivePath("/workdays") ? "active" : undefined}
            to="/workdays"
            onClick={handleNavbarNavigation("/workdays")}
          >
            Workdays
          </Link>
          <Link
            className={isActivePath("/removed") ? "active" : undefined}
            to="/removed"
            onClick={handleNavbarNavigation("/removed")}
          >
            Archived Cows
          </Link>
          <Link
            className={isActivePath("/workdays/removed") ? "active" : undefined}
            to="/workdays/removed"
            onClick={handleNavbarNavigation("/workdays/removed")}
          >
            Archived Workdays
          </Link>
          <Link
            className={isActivePath("/finances") ? "active" : undefined}
            to="/finances"
            onClick={handleNavbarNavigation("/finances")}
          >
            Finances
          </Link>
        </div>
      </div>
      <Modal
        isOpen={pendingPath !== null}
        title="Pending Cows to Add"
        message="You have cows pending to be added to this workday. Add them before leaving, or continue without adding them."
        confirmText="Leave Page"
        onCancel={() => setPendingPath(null)}
        onConfirm={() => {
          if (!pendingPath) return;
          navigate(pendingPath);
          setPendingPath(null);
        }}
      />
    </>
  );
}
export default Navbar;
