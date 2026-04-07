import "../../styles/Modal.css";

type ModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  hideCancel?: boolean;
};

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  hideCancel = false,
}: ModalProps) {
  if (!isOpen) return null;

  const confirmButtonClassName =
    confirmText === "Restore Cow"
      ? "success"
      : hideCancel
        ? "neutral"
        : "danger";

  return (
    <div className="modalOverlay" onClick={onCancel}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modalActions">
          {!hideCancel && (
            <button
              className="cancelButton"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              Cancel
            </button>
          )}
          <button
            className={confirmButtonClassName}
            onClick={(e) => {
              e.stopPropagation();
              onConfirm();
            }}
          >
            {confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
