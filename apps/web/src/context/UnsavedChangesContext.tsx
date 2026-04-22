import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useBlocker, useLocation } from "react-router-dom";
import Modal from "../components/shared/Modal";

type UnsavedChangesRegistration = {
  hasUnsavedChanges: boolean;
  title?: string;
  message?: string;
};

type UnsavedChangesContextValue = {
  allowNavigation: (action: () => void) => void;
  clearRegistration: (id: string) => void;
  setRegistration: (id: string, value: UnsavedChangesRegistration) => void;
};

const DEFAULT_TITLE = "Unsaved Changes";
const DEFAULT_MESSAGE =
  "You have unsaved changes. Are you sure you want to leave without saving?";

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

type UnsavedChangesProviderProps = {
  children: ReactNode;
};

export function UnsavedChangesProvider({
  children,
}: UnsavedChangesProviderProps) {
  const location = useLocation();
  const [registrations, setRegistrations] = useState<
    Record<string, UnsavedChangesRegistration>
  >({});
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const allowNextNavigationRef = useRef(false);

  const activeRegistration = useMemo(() => {
    const entries = Object.values(registrations);

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      if (entries[index].hasUnsavedChanges) {
        return entries[index];
      }
    }

    return null;
  }, [registrations]);

  const blocker = useBlocker(
    Boolean(activeRegistration?.hasUnsavedChanges) &&
      !allowNextNavigationRef.current,
  );

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (
        !activeRegistration?.hasUnsavedChanges ||
        allowNextNavigationRef.current
      ) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeRegistration]);

  useEffect(() => {
    if (blocker.state !== "blocked") {
      return;
    }

    setShowUnsavedModal(true);
  }, [blocker.state]);

  useEffect(() => {
    allowNextNavigationRef.current = false;
  }, [location.key]);

  const setRegistration = useCallback(
    (id: string, value: UnsavedChangesRegistration) => {
      setRegistrations((current) => ({
        ...current,
        [id]: value,
      }));
    },
    [],
  );

  const clearRegistration = useCallback((id: string) => {
    setRegistrations((current) => {
      if (!(id in current)) {
        return current;
      }

      const next = { ...current };
      delete next[id];
      return next;
    });
  }, []);

  const allowNavigation = useCallback((action: () => void) => {
    allowNextNavigationRef.current = true;

    try {
      action();
    } finally {
      window.setTimeout(() => {
        allowNextNavigationRef.current = false;
      }, 0);
    }
  }, []);

  const value = useMemo(
    () => ({
      allowNavigation,
      clearRegistration,
      setRegistration,
    }),
    [allowNavigation, clearRegistration, setRegistration],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <Modal
        isOpen={showUnsavedModal}
        title={activeRegistration?.title ?? DEFAULT_TITLE}
        message={activeRegistration?.message ?? DEFAULT_MESSAGE}
        confirmText="Leave Without Saving"
        confirmVariant="danger"
        onCancel={() => {
          setShowUnsavedModal(false);

          if (blocker.state === "blocked") {
            blocker.reset();
          }
        }}
        onConfirm={() => {
          setShowUnsavedModal(false);
          allowNextNavigationRef.current = true;

          if (blocker.state === "blocked") {
            blocker.proceed();
          }
        }}
      />
    </UnsavedChangesContext.Provider>
  );
}

type UseUnsavedChangesGuardOptions = {
  hasUnsavedChanges: boolean;
  message?: string;
  title?: string;
};

export function useUnsavedChangesGuard({
  hasUnsavedChanges,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesGuardOptions) {
  const context = useContext(UnsavedChangesContext);

  if (!context) {
    throw new Error(
      "useUnsavedChangesGuard must be used within an UnsavedChangesProvider",
    );
  }

  const id = useId();

  useEffect(() => {
    context.setRegistration(id, {
      hasUnsavedChanges,
      title,
      message,
    });

    return () => {
      context.clearRegistration(id);
    };
  }, [context, hasUnsavedChanges, id, message, title]);

  return {
    allowNavigation: context.allowNavigation,
  };
}
