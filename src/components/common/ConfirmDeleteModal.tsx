import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  recordType: string;
  recordName: string;
  details?: string;
  warningNote?: string;
  isProcessing?: boolean;
  confirmButtonLabel?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  recordType,
  recordName,
  details,
  warningNote,
  isProcessing = false,
  confirmButtonLabel = 'Delete Record',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title={title}
      subtitle={`Permanently remove or archive ${recordType}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors shadow-xs disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing...' : confirmButtonLabel}</span>
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
          <div className="p-1.5 bg-rose-100 rounded-full shrink-0 text-rose-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs text-rose-900">
            <div className="font-semibold text-sm text-rose-950">
              Confirm {recordType} Deletion
            </div>
            <p className="mt-1 leading-relaxed">
              Are you sure you want to delete <strong className="font-mono text-rose-950">{recordName}</strong> from the database?
            </p>
            {details && <p className="mt-1 text-rose-800">{details}</p>}
          </div>
        </div>

        {warningNote ? (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
            <div className="font-semibold flex items-center gap-1">
              <span>Notice:</span>
            </div>
            <p className="mt-0.5 text-amber-800 leading-normal">{warningNote}</p>
          </div>
        ) : (
          <p className="text-slate-500 text-xs leading-normal">
            This action will update the Render PostgreSQL cloud database and synchronize across both your mobile device and laptop.
          </p>
        )}
      </div>
    </Modal>
  );
};
