import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  getPasswordRequirementsMessage,
  isStrongPassword,
} from "../lib/account";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const urlMode =
    requestedMode === "signup" || requestedMode === "login"
      ? requestedMode
      : "login";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null,
  );

  const mode = isForgotMode ? "forgot" : urlMode;

  const normalizedEmail = email.trim().toLowerCase();

  const isEmailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    if (!normalizedEmail) {
      setMessage("Email is required.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!isEmailLike) {
      setMessage("Enter a valid email address.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!password.trim()) {
      setMessage("Password is required.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!isStrongPassword(password)) {
      setMessage(getPasswordRequirementsMessage());
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Account created. Check your email to confirm your account before signing in.",
    );
    setMessageType("success");
    setPassword("");
    setIsSubmitting(false);
  };

  const handleLogin = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    if (!normalizedEmail) {
      setMessage("Email is required.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!isEmailLike) {
      setMessage("Enter a valid email address.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
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

  const handleForgotPassword = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    if (!normalizedEmail) {
      setMessage("Email is required.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!isEmailLike) {
      setMessage("Enter a valid email address.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizedEmail,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      },
    );

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    setMessage(
      "Password reset email sent. Check your inbox for the reset link.",
    );
    setMessageType("success");
    setIsSubmitting(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mode === "login") {
      await handleLogin();
      return;
    }

    if (mode === "signup") {
      await handleSignUp();
      return;
    }

    await handleForgotPassword();
  };

  return (
    <div className={mode === "signup" ? "authPage authPageSignup" : "authPage"}>
      <Link className="authBackLink" to="/">
        <span aria-hidden="true" className="authBackLinkIcon">
          ←
        </span>
        Back to HerdFlow
      </Link>
      <div
        className={
          mode === "signup" ? "authShell authShellSignup" : "authShell"
        }
      >
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
            Track cattle, workdays, notes, and daily ranch decisions — replacing
            your handwritten cattle notebook, calendar, or napkin.
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
          <form className="authFormCard" onSubmit={handleSubmit}>
            <div className="authFormHeader">
              <p className="authFormKicker">
                {mode === "signup" ? "Start simple" : "Welcome back"}
              </p>
              <h2 className="authFormTitle">
                {mode === "signup"
                  ? "Create your HerdFlow account"
                  : "Sign in to your ranch"}
              </h2>
              <p className="authFormCopy">
                {mode === "forgot"
                  ? "Enter your email and we will send you a password reset link."
                  : mode === "signup"
                    ? "Create your account in seconds. Add farm details later in settings."
                    : "Sign in to continue, or create an account to start managing your operation in HerdFlow."}
              </p>
            </div>

            {mode === "forgot" ? (
              <button
                className="authTextButton authTextButtonInline"
                onClick={() => {
                  setIsForgotMode(false);
                  setMessage(null);
                  setMessageType(null);
                }}
                type="button"
              >
                Back to sign in
              </button>
            ) : (
              <div
                className="authModeSwitch"
                role="tablist"
                aria-label="Auth mode"
              >
                <button
                  className={
                    mode === "login"
                      ? "authModeButton active"
                      : "authModeButton"
                  }
                  onClick={() => {
                    setSearchParams({ mode: "login" });
                    setIsForgotMode(false);
                    setMessage(null);
                    setMessageType(null);
                  }}
                  type="button"
                >
                  Log In
                </button>
                <button
                  className={
                    mode === "signup"
                      ? "authModeButton active"
                      : "authModeButton"
                  }
                  onClick={() => {
                    setSearchParams({ mode: "signup" });
                    setIsForgotMode(false);
                    setMessage(null);
                    setMessageType(null);
                  }}
                  type="button"
                >
                  Sign Up
                </button>
              </div>
            )}

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

              {mode !== "forgot" ? (
                <label className="authField">
                  <span>Password</span>
                  <input
                    className="authInput"
                    placeholder={
                      mode === "signup"
                        ? "Create a secure password"
                        : "Enter your password"
                    }
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </label>
              ) : null}
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
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Signing in..." : "Log In"}
                </button>
              ) : mode === "forgot" ? (
                <button
                  className="authPrimaryButton"
                  disabled={isSubmitting || normalizedEmail.length === 0}
                  type="submit"
                >
                  {isSubmitting ? "Sending reset email..." : "Send Reset Link"}
                </button>
              ) : (
                <button
                  className="authPrimaryButton"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? "Creating account..."
                    : "Start Tracking Your Herd"}
                </button>
              )}
            </div>

            {mode === "login" ? (
              <div className="authAuxiliaryActions">
                <button
                  className="authTextButton"
                  onClick={() => {
                    setIsForgotMode(true);
                    setPassword("");
                    setMessage(null);
                    setMessageType(null);
                  }}
                  type="button"
                >
                  Forgot password?
                </button>
              </div>
            ) : null}

            <p className="authFormFootnote">
              Built for herd records, workday planning, and daily ranch follow
              through.
            </p>
          </form>
        </section>
      </div>
    </div>
  );
}
