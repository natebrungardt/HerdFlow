import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getPasswordRequirementsMessage,
  getUserProfileDefaults,
  isStrongPassword,
} from "../lib/account";
import { supabase } from "../lib/supabase";
import "../styles/AllCows.css";
import "../styles/CowDetailPage.css";
import "../styles/AccountSettings.css";

type ProfileFormState = {
  displayName: string;
  farmName: string;
  defaultOwnerName: string;
};

function AccountSettingsPage() {
  const { user } = useContext(AuthContext);
  const [profileValues, setProfileValues] = useState<ProfileFormState>(() =>
    getUserProfileDefaults(user),
  );
  const [emailValue, setEmailValue] = useState(user?.email ?? "");
  const [passwordValue, setPasswordValue] = useState("");
  const [confirmPasswordValue, setConfirmPasswordValue] = useState("");
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileMessageType, setProfileMessageType] = useState<
    "error" | "success" | null
  >(null);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailMessageType, setEmailMessageType] = useState<
    "error" | "success" | null
  >(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordMessageType, setPasswordMessageType] = useState<
    "error" | "success" | null
  >(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  if (!user) {
    return null;
  }

  const authenticatedUser = user;
  const currentEmail = authenticatedUser.email ?? "";
  const normalizedCurrentEmail = currentEmail.trim().toLowerCase();
  const normalizedNewEmail = emailValue.trim().toLowerCase();
  const canSubmitEmailUpdate =
    normalizedNewEmail.length > 0 &&
    normalizedNewEmail !== normalizedCurrentEmail;

  function handleProfileFieldChange(
    field: keyof ProfileFormState,
    value: string,
  ) {
    setProfileValues((current) => ({
      ...current,
      [field]: value,
    }));
    setProfileMessage(null);
    setProfileMessageType(null);
  }

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileMessage(null);
    setProfileMessageType(null);
    setIsSavingProfile(true);

    const nextProfileValues = {
      displayName: profileValues.displayName.trim(),
      farmName: profileValues.farmName.trim(),
      defaultOwnerName: profileValues.defaultOwnerName.trim(),
    };

    const { error } = await supabase.auth.updateUser({
      data: {
        ...(authenticatedUser.user_metadata ?? {}),
        display_name: nextProfileValues.displayName,
        full_name: nextProfileValues.displayName,
        farm_name: nextProfileValues.farmName,
        default_owner_name: nextProfileValues.defaultOwnerName,
      },
    });

    if (error) {
      setProfileMessage(error.message);
      setProfileMessageType("error");
      setIsSavingProfile(false);
      return;
    }

    setProfileValues(nextProfileValues);
    setProfileMessage("Saved successfully.");
    setProfileMessageType("success");
    setIsSavingProfile(false);
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEmailMessage(null);
    setEmailMessageType(null);

    const normalizedEmail = emailValue.trim().toLowerCase();

    if (!normalizedEmail) {
      setEmailMessage("Email is required.");
      setEmailMessageType("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailMessage("Enter a valid email address.");
      setEmailMessageType("error");
      return;
    }

    if (normalizedEmail === normalizedCurrentEmail) {
      setEmailMessage("Your email address is already up to date.");
      setEmailMessageType("success");
      return;
    }

    setIsSavingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: normalizedEmail,
    });

    if (error) {
      setEmailMessage(error.message);
      setEmailMessageType("error");
      setIsSavingEmail(false);
      return;
    }

    setEmailValue("");
    setIsEditingEmail(false);
    setEmailMessage(
      "Email update requested. Check both inboxes for any confirmation steps required by Supabase.",
    );
    setEmailMessageType("success");
    setIsSavingEmail(false);
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    setPasswordMessageType(null);

    if (!isStrongPassword(passwordValue)) {
      setPasswordMessage(getPasswordRequirementsMessage());
      setPasswordMessageType("error");
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      setPasswordMessage("Passwords do not match.");
      setPasswordMessageType("error");
      return;
    }

    setIsSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password: passwordValue,
    });

    if (error) {
      setPasswordMessage(error.message);
      setPasswordMessageType("error");
      setIsSavingPassword(false);
      return;
    }

    setPasswordValue("");
    setConfirmPasswordValue("");
    setPasswordMessage("Saved successfully.");
    setPasswordMessageType("success");
    setIsSavingPassword(false);
  }

  return (
    <div className="allCowsPage">
      <div className="allCowsShell">
        <div className="allCowsContent">
          <div className="allCowsHeader">
            <div className="titleBlock">
              <h1 className="pageTitle">Account Settings</h1>
              <p className="pageSubtitle">
                Manage your ranch profile, security details, and the defaults
                that speed up daily record keeping.
              </p>
            </div>
          </div>

          <div className="accountSettingsGrid">
            <section className="dashboardCard accountSettingsCard">
              <div className="dataCardHeader">
                <div>
                  <h2 className="cardTitle">Profile</h2>
                  <p className="accountSettingsIntro">
                    Set the name HerdFlow shows around the app and the ranch
                    details that help with day-to-day data entry.
                  </p>
                </div>
              </div>

              <form
                className="accountSettingsForm"
                onSubmit={handleProfileSubmit}
              >
                <label className="accountSettingsField">
                  <span>Display Name</span>
                  <input
                    className="authInput"
                    onChange={(event) =>
                      handleProfileFieldChange(
                        "displayName",
                        event.target.value,
                      )
                    }
                    placeholder="How your name appears in HerdFlow"
                    type="text"
                    value={profileValues.displayName}
                  />
                </label>

                <label className="accountSettingsField">
                  <span>Farm Name</span>
                  <input
                    className="authInput"
                    onChange={(event) =>
                      handleProfileFieldChange("farmName", event.target.value)
                    }
                    placeholder="Your ranch or operation name"
                    type="text"
                    value={profileValues.farmName}
                  />
                </label>

                <label className="accountSettingsField">
                  <span>Default Owner / Ranch Name</span>
                  <input
                    className="authInput"
                    onChange={(event) =>
                      handleProfileFieldChange(
                        "defaultOwnerName",
                        event.target.value,
                      )
                    }
                    type="text"
                    value={profileValues.defaultOwnerName}
                  />
                  <span className="accountSettingsHelperText">
                    Used to prefill new cow records.
                  </span>
                </label>

                {profileMessage ? (
                  <p
                    className={
                      profileMessageType === "success"
                        ? "authMessage authMessageSuccess"
                        : "authMessage authMessageError"
                    }
                  >
                    {profileMessage}
                  </p>
                ) : null}

                <div className="accountSettingsActions">
                  <button
                    className="addCowButton"
                    disabled={isSavingProfile}
                    type="submit"
                  >
                    {isSavingProfile ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </form>
            </section>

            <section
              className="dashboardCard accountSettingsCard"
              id="security"
            >
              <div className="dataCardHeader">
                <div>
                  <h2 className="cardTitle">Security</h2>
                  <p className="accountSettingsIntro">
                    Update the email address and password tied to your account.
                  </p>
                </div>
              </div>

              <div className="accountSettingsStack">
                <form
                  className="accountSettingsForm"
                  onSubmit={handleEmailSubmit}
                >
                  <label className="accountSettingsField">
                    <span>Current Email</span>
                    <input
                      className="authInput accountSettingsReadonlyInput"
                      disabled
                      readOnly
                      type="text"
                      value={currentEmail}
                    />
                  </label>

                  <label className="accountSettingsField">
                    <span>New Email Address</span>
                    <input
                      className="authInput"
                      autoComplete="email"
                      disabled={!isEditingEmail}
                      onChange={(event) => {
                        setEmailValue(event.target.value);
                        setEmailMessage(null);
                        setEmailMessageType(null);
                      }}
                      placeholder="you@ranch.com"
                      type="email"
                      value={emailValue}
                    />
                  </label>

                  {emailMessage ? (
                    <p
                      className={
                        emailMessageType === "success"
                          ? "authMessage authMessageSuccess"
                          : "authMessage authMessageError"
                      }
                    >
                      {emailMessage}
                    </p>
                  ) : null}

                  <div className="accountSettingsActionBlock">
                    <div className="accountSettingsActions">
                      {isEditingEmail ? (
                        <>
                          <button
                            className="addCowButton"
                            disabled={isSavingEmail || !canSubmitEmailUpdate}
                            type="submit"
                          >
                            {isSavingEmail ? "Updating..." : "Save Email"}
                          </button>
                          <button
                            className="addCowButton addCowButtonGhost"
                            onClick={() => {
                              setIsEditingEmail(false);
                              setEmailValue("");
                              setEmailMessage(null);
                              setEmailMessageType(null);
                            }}
                            type="button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          className="addCowButton"
                          onClick={() => {
                            setIsEditingEmail(true);
                            setEmailValue("");
                            setEmailMessage(null);
                            setEmailMessageType(null);
                          }}
                          type="button"
                        >
                          Update Email
                        </button>
                      )}
                    </div>
                    <p className="accountSettingsHelperText">
                      You&apos;ll receive a confirmation email to verify this
                      change.
                    </p>
                  </div>
                </form>

                <form
                  className="accountSettingsForm accountSettingsPasswordForm"
                  onSubmit={handlePasswordSubmit}
                >
                  <label className="accountSettingsField">
                    <span>New Password</span>
                    <input
                      className="authInput"
                      autoComplete="new-password"
                      onChange={(event) => {
                        setPasswordValue(event.target.value);
                        setPasswordMessage(null);
                        setPasswordMessageType(null);
                      }}
                      placeholder="At least 8 characters, including a letter and a number"
                      type="password"
                      value={passwordValue}
                    />
                  </label>

                  <label className="accountSettingsField">
                    <span>Confirm New Password</span>
                    <input
                      className="authInput"
                      autoComplete="new-password"
                      onChange={(event) => {
                        setConfirmPasswordValue(event.target.value);
                        setPasswordMessage(null);
                        setPasswordMessageType(null);
                      }}
                      placeholder="Re-enter your new password"
                      type="password"
                      value={confirmPasswordValue}
                    />
                  </label>

                  {passwordMessage ? (
                    <p
                      className={
                        passwordMessageType === "success"
                          ? "authMessage authMessageSuccess"
                          : "authMessage authMessageError"
                      }
                    >
                      {passwordMessage}
                    </p>
                  ) : null}

                  <div className="accountSettingsActions">
                    <button
                      className="addCowButton"
                      disabled={isSavingPassword}
                      type="submit"
                    >
                      {isSavingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountSettingsPage;
