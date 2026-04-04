import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "../lib/supabase";

export default function AuthPage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success" | null>(
    null,
  );

  const normalizedEmail = email.trim().toLowerCase();

  const isEmailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
  const isPhoneLike = /^[0-9()\-\s]+$/.test(phoneNumber.trim());

  const handleSignUp = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setMessageType(null);

    const normalizedName = fullName.trim();
    const normalizedPhone = phoneNumber.trim();

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

    if (!normalizedName) {
      setMessage("Name is required.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!normalizedPhone) {
      setMessage("Phone number is required.");
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    if (!isPhoneLike) {
      setMessage(
        "Phone number can only include digits, spaces, dashes, and parentheses.",
      );
      setMessageType("error");
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: normalizedName,
          phone: normalizedPhone,
        },
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
              <p className="authFormKicker">Welcome back</p>
              <h2 className="authFormTitle">Access your ranch dashboard</h2>
              <p className="authFormCopy">
                {mode === "forgot"
                  ? "Enter your email and we will send you a password reset link."
                  : "Sign in to continue, or create an account to start managing your operation in HerdFlow."}
              </p>
            </div>

            {mode === "forgot" ? (
              <button
                className="authTextButton authTextButtonInline"
                onClick={() => {
                  setMode("login");
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
                    mode === "signup"
                      ? "authModeButton active"
                      : "authModeButton"
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

              {mode === "signup" ? (
                <label className="authField">
                  <span>Name</span>
                  <input
                    className="authInput"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    type="text"
                    autoComplete="name"
                  />
                </label>
              ) : null}

              {mode === "signup" ? (
                <label className="authField">
                  <span>Phone Number</span>
                  <input
                    className="authInput"
                    placeholder="(555) 555-5555"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    type="tel"
                    autoComplete="tel"
                  />
                </label>
              ) : null}

              {mode !== "forgot" ? (
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
                  {isSubmitting ? "Creating account..." : "Create Account"}
                </button>
              )}
            </div>

            {mode === "login" ? (
              <div className="authAuxiliaryActions">
                <button
                  className="authTextButton"
                  onClick={() => {
                    setMode("forgot");
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
