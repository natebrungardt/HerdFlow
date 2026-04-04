import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { AuthContext } from "../context/AuthContext";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { setPasswordRecovery } = useContext(AuthContext);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [canReset, setCanReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null,
  );

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setCanReset(Boolean(session));
      setLoadingSession(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) {
        return;
      }

      if (event === "PASSWORD_RECOVERY" || session) {
        setCanReset(Boolean(session));
      }

      setLoadingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleResetPassword = async () => {
    setMessage(null);
    setMessageType(null);

    if (password.trim().length < 6) {
      setMessage("Password must be at least 6 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setMessage(signOutError.message);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    setMessage("Password updated. Sign in with your new password.");
    setMessageType("success");
    setPasswordRecovery(false);
    setIsSubmitting(false);
    window.setTimeout(() => {
      navigate("/");
    }, 1200);
  };

  const handleBackToAuth = async () => {
    await supabase.auth.signOut();
    setPasswordRecovery(false);
    navigate("/");
  };

  return (
    <div className="authPage">
      <div className="authShell authShellSingle">
        <section className="authFormPanel authFormPanelCentered">
          <div className="authFormCard">
            <div className="authFormHeader">
              <p className="authFormKicker">Secure access</p>
              <h1 className="authFormTitle">Reset your password</h1>
              <p className="authFormCopy">
                Choose a new password for your HerdFlow account.
              </p>
            </div>

            {loadingSession ? (
              <p className="authMessage">Checking your reset link...</p>
            ) : !canReset ? (
              <p className="authMessage authMessageError">
                This reset link is invalid or expired. Request a new password
                reset email from the sign-in page.
              </p>
            ) : (
              <>
                <div className="authFormFields">
                  <label className="authField">
                    <span>New Password</span>
                    <input
                      className="authInput"
                      placeholder="Enter a new password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </label>

                  <label className="authField">
                    <span>Confirm Password</span>
                    <input
                      className="authInput"
                      placeholder="Re-enter your new password"
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                    />
                  </label>
                </div>

                {message ? (
                  <p
                    className={
                      messageType === "success"
                        ? "authMessage authMessageSuccess"
                        : "authMessage authMessageError"
                    }
                  >
                    {message}
                  </p>
                ) : null}

                <div className="authActions">
                  <button
                    className="authPrimaryButton"
                    onClick={handleResetPassword}
                    disabled={isSubmitting}
                    type="button"
                  >
                    {isSubmitting ? "Updating password..." : "Update Password"}
                  </button>
                </div>
              </>
            )}

            <div className="authAuxiliaryActions">
              <button
                className="authTextButton"
                onClick={() => {
                  void handleBackToAuth();
                }}
                type="button"
              >
                Back to HerdFlow
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
