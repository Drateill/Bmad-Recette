import { useState } from 'react';
import Modal from '../shared/Modal';

interface PortionAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServings: number;
  onApply: (multiplier: number) => void;
}

export default function PortionAdjustmentModal({
  isOpen,
  onClose,
  currentServings,
  onApply,
}: PortionAdjustmentModalProps) {
  const [multiplier, setMultiplier] = useState(1);

  const newServings = Math.round(currentServings * multiplier);

  const handleApply = () => {
    onApply(multiplier);
    onClose();
  };

  const handleReset = () => {
    setMultiplier(1);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Adjust Portions" size="md">
      <div className="space-y-6">
        <div>
          <p className="mb-4 text-sm text-text-secondary">
            Adjust the serving size to automatically scale all ingredient
            quantities.
          </p>

          <div className="mb-6 rounded-xl border border-brand-primary/30 bg-brand-primary/10 p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-text-muted">Original Servings</p>
                <p className="text-2xl font-semibold text-text-primary">
                  {currentServings}
                </p>
              </div>
              <div className="text-text-muted">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-text-muted">New Servings</p>
                <p className="text-2xl font-semibold text-brand-primary">
                  {newServings}
                </p>
              </div>
            </div>
          </div>

          {/* Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-text-secondary">
                Multiplier: {multiplier.toFixed(2)}x
              </label>
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-brand-primary hover:text-brand-primary-dark"
              >
                Reset
              </button>
            </div>
            <input
              type="range"
              min="0.25"
              max="10"
              step="0.25"
              value={multiplier}
              onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-muted accent-brand-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-text-muted">
              <span>0.25x</span>
              <span>5x</span>
              <span>10x</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[0.5, 1, 2, 3, 4].map((value) => (
              <button
                key={value}
                onClick={() => setMultiplier(value)}
                className={`rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                  multiplier === value
                    ? 'border-brand-primary bg-brand-primary text-text-inverse'
                    : 'border-border-subtle bg-surface-elevated text-text-secondary hover:border-brand-primary'
                }`}
              >
                {value}x
              </button>
            ))}
          </div>

          {/* Info */}
          <div className="rounded-xl bg-surface-muted p-3 text-xs text-text-muted">
            <p>
              <strong>Note:</strong> This adjustment is temporary and only
              affects the current view. Original recipe quantities will remain
              unchanged.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 justify-end border-t border-border-subtle pt-4">
          <button
            onClick={onClose}
            className="rounded-full border border-border-subtle px-6 py-2 text-xs font-semibold text-text-secondary hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="rounded-full bg-brand-primary px-6 py-2 text-xs font-semibold text-text-inverse hover:bg-brand-primary-dark"
          >
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}
