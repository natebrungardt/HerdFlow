import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  useContext,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePendingWorkdaySelection } from "../../context/usePendingWorkdaySelection";
import { useTheme } from "../../context/useTheme";
import Modal from "./Modal";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPendingSelections } = usePendingWorkdaySelection();
  const { theme, toggleTheme } = useTheme();
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const { user } = useContext(AuthContext);

  const accountName = useMemo(() => {
    const metadataName =
      typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : typeof user?.user_metadata?.name === "string"
          ? user.user_metadata.name
          : null;

    if (metadataName?.trim()) {
      return metadataName.trim();
    }

    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "Account";
  }, [user]);

  const hasDisplayName = accountName !== "Account";

  const accountInitial = useMemo(() => {
    return accountName.charAt(0).toUpperCase() || "A";
  }, [accountName]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | globalThis.MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const handleLogout = async () => {
    setIsAccountMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  };

  const handleOpenResetPassword = () => {
    setIsAccountMenuOpen(false);
    navigate("/reset-password");
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setIsAccountMenuOpen(false);
  };

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
          <Link
            className={isActivePath("/") ? "active" : undefined}
            to="/"
            onClick={handleNavbarNavigation("/")}
          >
            Herd Summary
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
          {user && (
            <div className="navbarAccount" ref={accountMenuRef}>
              <button
                className="navbarAccountButton"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                type="button"
              >
                <span className="navbarAvatar">{accountInitial}</span>
                {hasDisplayName ? (
                  <span className="navbarAccountCopy">
                    <span className="navbarAccountName">{accountName}</span>
                  </span>
                ) : null}
                <span className="navbarAccountChevron" aria-hidden="true">
                  {isAccountMenuOpen ? "▲" : "▼"}
                </span>
              </button>

              {isAccountMenuOpen ? (
                <div className="navbarAccountMenu">
                  <div className="navbarAccountMenuHeader">
                    <span className="navbarAccountMenuName">{accountName}</span>
                    {user.email ? (
                      <span className="navbarAccountMenuEmail">
                        {user.email}
                      </span>
                    ) : null}
                  </div>
                  <button
                    className="navbarMenuItem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    type="button"
                  >
                    Profile
                  </button>
                  <button
                    className="navbarMenuItem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    type="button"
                  >
                    Farm Settings
                  </button>
                  <button
                    className="navbarMenuItem"
                    onClick={handleToggleTheme}
                    type="button"
                  >
                    {theme === "dark" ? "Light Mode" : "Dark Mode"}
                  </button>
                  <button
                    className="navbarMenuItem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    type="button"
                  >
                    Export Data
                  </button>
                  <button
                    className="navbarMenuItem"
                    onClick={handleOpenResetPassword}
                    type="button"
                  >
                    Change Password
                  </button>
                  <button
                    className="navbarMenuItem navbarMenuItemDanger"
                    onClick={handleLogout}
                    type="button"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          )}
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
