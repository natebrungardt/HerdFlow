import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useContext,
  type MouseEvent,
} from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../context/useTheme";
import FeedbackModal from "./FeedbackModal";
import { getUserDisplayName, getUserFarmName } from "../../lib/account";
import { supabase } from "../../lib/supabase";
import { AuthContext } from "../../context/AuthContext";
import { exportCowsCsv } from "../../services/cowService";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  const { user } = useContext(AuthContext);

  const accountName = useMemo(() => getUserDisplayName(user), [user]);
  const farmName = useMemo(() => getUserFarmName(user), [user]);

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
        setExportError("");
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

  const handleOpenAccountSettings = () => {
    setIsAccountMenuOpen(false);
    navigate("/account-settings");
  };

  const handleOpenFeedback = () => {
    setIsAccountMenuOpen(false);
    setIsFeedbackModalOpen(true);
  };

  const handleToggleTheme = () => {
    toggleTheme();
    setIsAccountMenuOpen(false);
    setExportError("");
  };

  const handleExportData = async () => {
    setExportError("");
    setIsExporting(true);

    try {
      await exportCowsCsv({ farmName });
      setIsAccountMenuOpen(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export herd data";
      setExportError(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleAccountMenu = () => {
    setExportError("");
    setIsAccountMenuOpen((open) => !open);
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
        (/^\/workdays\/[^/]+(?:\/active)?$/.test(location.pathname) &&
          location.pathname !== "/workdays/completed")
      );
    }

    return location.pathname === targetPath;
  }

  return (
    <>
      <div className="navbar">
        <Link className="navbar-left" to="/">
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
          >
            Herd Summary
          </Link>
          <Link
            className={isActivePath("/cows") ? "active" : undefined}
            to="/cows"
          >
            Herd
          </Link>
          <Link
            className={isActivePath("/workdays") ? "active" : undefined}
            to="/workdays"
          >
            Workdays
          </Link>
          <Link
            className={
              isActivePath("/workdays/completed") ? "active" : undefined
            }
            to="/workdays/completed"
          >
            Completed Workdays
          </Link>
          <Link
            className={isActivePath("/removed") ? "active" : undefined}
            to="/removed"
          >
            Archived Cows
          </Link>
          <Link
            className={isActivePath("/finances") ? "active" : undefined}
            to="/finances"
          >
            Finances
          </Link>
          {user && (
            <div className="navbarAccount" ref={accountMenuRef}>
              <button
                className="navbarAccountButton"
                onClick={handleToggleAccountMenu}
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
                  {exportError ? (
                    <div className="notesErrorBanner">{exportError}</div>
                  ) : null}
                  <button
                    className="navbarMenuItem"
                    onClick={handleOpenAccountSettings}
                    type="button"
                  >
                    Account Settings
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
                    disabled={isExporting}
                    onClick={handleExportData}
                    type="button"
                  >
                    {isExporting ? "Exporting..." : "Export Herd Data"}
                  </button>
                  <button
                    className="navbarMenuItem"
                    onClick={handleOpenFeedback}
                    type="button"
                  >
                    Feedback
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
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        user={user}
      />
    </>
  );
}
export default Navbar;
