import "../styles/Modal.css";

type ModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function Modal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modalOverlay" onClick={onCancel}>
      <div className="modalCard" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>

        <div className="modalActions">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
          >
            Cancel
          </button>
          <button
            className="danger"
            onClick={(e) => {
              e.stopPropagation();
              console.log("MODAL BUTTON CLICKED");
              onConfirm();
            }}
          >
            Remove Cow
          </button>
        </div>
      </div>
    </div>
  );
}
