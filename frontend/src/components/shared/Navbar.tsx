import { useState, type MouseEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePendingWorkdaySelection } from "../../context/PendingWorkdaySelectionContext";
import Modal from "./Modal";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPendingSelections } = usePendingWorkdaySelection();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

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
          HerdFlow
        </Link>
        <div className="navbar-links">
          <Link to="/" onClick={handleNavbarNavigation("/")}>
            Dashboard
          </Link>
          <Link to="/cows" onClick={handleNavbarNavigation("/cows")}>
            Herd
          </Link>
          <Link to="/workdays" onClick={handleNavbarNavigation("/workdays")}>
            Workdays
          </Link>
          <Link to="/removed" onClick={handleNavbarNavigation("/removed")}>
            Archived Cows
          </Link>
          <Link
            to="/workdays/removed"
            onClick={handleNavbarNavigation("/workdays/removed")}
          >
            Archived Workdays
          </Link>
          <Link to="/finances" onClick={handleNavbarNavigation("/finances")}>
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
