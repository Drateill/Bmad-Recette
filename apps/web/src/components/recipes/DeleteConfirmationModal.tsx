import Modal from '../shared/Modal';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipeName: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  recipeName,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Recipe" size="sm">
      <div className="space-y-6">
        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-brand-error/10 p-3">
            <svg
              className="w-12 h-12 text-brand-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-text-primary">
            Are you sure?
          </h3>
          <p className="text-sm text-text-secondary">
            You are about to delete{' '}
            <span className="font-semibold">&ldquo;{recipeName}&rdquo;</span>.
          </p>
          <p className="mt-2 text-sm font-semibold text-brand-error">
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={onClose}
            className="rounded-full border border-border-subtle px-6 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-muted"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-full bg-brand-error px-6 py-2 text-xs font-semibold text-text-inverse transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Recipe'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
