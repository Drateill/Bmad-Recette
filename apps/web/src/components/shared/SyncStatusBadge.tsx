import { useEffect, useState } from 'react';

export default function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isOnline
          ? 'border-brand-secondary text-brand-secondary'
          : 'border-brand-warning text-brand-warning'
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isOnline ? 'bg-brand-secondary' : 'bg-brand-warning'
        }`}
      />
      {isOnline ? 'Synced' : 'Offline'}
    </div>
  );
}
