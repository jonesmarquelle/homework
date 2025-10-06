import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onSave?: () => void;
  saveText?: string;
  showSave?: boolean;
  isSaving?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Yes',
  cancelText = 'Cancel',
  onSave,
  saveText = 'Save Changes',
  showSave = false,
  isSaving = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button 
            className="modal-btn modal-btn-cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          {showSave && onSave && (
            <button 
              className="modal-btn modal-btn-save" 
              onClick={onSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : saveText}
            </button>
          )}
          <button 
            className="modal-btn modal-btn-confirm" 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
