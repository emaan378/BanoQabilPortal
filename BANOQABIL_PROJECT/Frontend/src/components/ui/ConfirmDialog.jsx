import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="ConfirmDialog-div-1">
      <div className="ConfirmDialog-div-2" onClick={onCancel} />
      <div className="ConfirmDialog-div-3">
        <div className="ConfirmDialog-div-4">
          <div className="ConfirmDialog-div-5">
            <AlertTriangle className="ConfirmDialog-alerttriangle-6" />
          </div>
          <h3 className="ConfirmDialog-h3-7">{title}</h3>
          <p className="ConfirmDialog-p-8">{message}</p>
          <div className="ConfirmDialog-div-9">
            <button
              onClick={onCancel}
              className="ConfirmDialog-button-10"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="ConfirmDialog-button-11"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
