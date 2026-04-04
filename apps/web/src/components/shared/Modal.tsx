import "../../styles/Modal.css";

type ModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
};

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onCancel}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modalActions">
          <button
            className="cancelButton"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            className={confirmText === "Restore Cow" ? "success" : "danger"}
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
