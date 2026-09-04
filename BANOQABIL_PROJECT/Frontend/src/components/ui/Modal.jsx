import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ open, onClose, title, icon: Icon, children, footer, size = 'md' }) {
  if (!open) return null;

  const maxW = size === 'lg' ? 'max-w-2xl' : size === 'sm' ? 'max-w-sm' : 'max-w-md';

  return (
    <div className="Modal-div-1">
      <div className="Modal-div-2" onClick={onClose} />
      <div className={`relative w-full ${maxW} bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col`}>
        <div className="Modal-div-3">
          <div className="Modal-div-4">
            {Icon && <Icon className="Modal-icon-5" />}
            <h3 className="Modal-h3-6">{title}</h3>
          </div>
          <button onClick={onClose} className="Modal-button-7">
            <X className="Modal-x-8" />
          </button>
        </div>
        <div className="Modal-div-9">{children}</div>
        {footer && <div className="Modal-div-10">{footer}</div>}
      </div>
    </div>
  );
}
