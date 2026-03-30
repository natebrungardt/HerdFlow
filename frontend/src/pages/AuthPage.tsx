import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null,
  );

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    setMessage("Account created. You can continue into HerdFlow.");
    setMessageType("success");
    window.location.href = "/";
  };

  const handleLogin = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    window.location.href = "/";
  };

  return (
    <div className="authPage">
      <div className="authShell">
        <section className="authBrandPanel">
          <div className="authBrandBadge">Ranch workflow, cleaned up.</div>
          <div className="authBrandLockup">
            <img
              className="authBrandLogo"
              src="/herdflow-mark.svg"
              alt="HerdFlow logo"
            />
            <div>
              <p className="authEyebrow">HerdFlow</p>
              <h1 className="authTitle">Run the herd with less friction.</h1>
            </div>
          </div>
          <p className="authLead">
            Track cattle, workdays, notes, and daily ranch decisions from one
            place that feels built for the way you actually work.
          </p>
          <div className="authHighlightStrip">
            <div className="authHighlightPill">
              <span className="authHighlightValue">Daily</span>
              <span className="authHighlightLabel">workday tracking</span>
            </div>
            <div className="authHighlightPill">
              <span className="authHighlightValue">One</span>
              <span className="authHighlightLabel">home for herd records</span>
            </div>
            <div className="authHighlightPill">
              <span className="authHighlightValue">Fast</span>
              <span className="authHighlightLabel">field-ready updates</span>
            </div>
          </div>
          <div className="authFeatureList">
            <div className="authFeatureCard">
              Clear herd records with quick updates and archived history.
            </div>
            <div className="authFeatureCard">
              Workday planning that keeps the crew aligned before you head out.
            </div>
            <div className="authFeatureCard">
              Notes and activity tracking without spreadsheet sprawl.
            </div>
          </div>
        </section>

        <section className="authFormPanel">
          <div className="authFormCard">
            <div className="authFormHeader">
              <p className="authFormKicker">Welcome back</p>
              <h2 className="authFormTitle">Access your ranch dashboard</h2>
              <p className="authFormCopy">
                Sign in to continue, or create an account to start managing your
                operation in HerdFlow.
              </p>
            </div>

            <div
              className="authModeSwitch"
              role="tablist"
              aria-label="Auth mode"
            >
              <button
                className={
                  mode === "login" ? "authModeButton active" : "authModeButton"
                }
                onClick={() => {
                  setMode("login");
                  setMessage(null);
                  setMessageType(null);
                }}
                type="button"
              >
                Log In
              </button>
              <button
                className={
                  mode === "signup" ? "authModeButton active" : "authModeButton"
                }
                onClick={() => {
                  setMode("signup");
                  setMessage(null);
                  setMessageType(null);
                }}
                type="button"
              >
                Sign Up
              </button>
            </div>

            <div className="authFormFields">
              <label className="authField">
                <span>Email</span>
                <input
                  className="authInput"
                  placeholder="you@ranch.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </label>

              <label className="authField">
                <span>Password</span>
                <input
                  className="authInput"
                  placeholder="Enter your password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
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
              {mode === "login" ? (
                <button
                  className="authPrimaryButton"
                  onClick={handleLogin}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? "Signing in..." : "Log In"}
                </button>
              ) : (
                <button
                  className="authPrimaryButton"
                  onClick={handleSignUp}
                  disabled={isSubmitting}
                  type="button"
                >
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </button>
              )}
            </div>

            <p className="authFormFootnote">
              Built for herd records, workday planning, and daily ranch follow
              through.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
