import { useTheme } from '../../context/ThemeContext';

const options = [
  { value: 'auto', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-text-secondary">Theme</span>
      <div className="flex rounded-full border border-border-subtle bg-surface-muted p-1">
        {options.map((option) => {
          const isActive = theme === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={`px-3 py-1 rounded-full transition-colors duration-base ${
                isActive
                  ? 'bg-brand-primary text-text-inverse'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={isActive}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span className="text-text-muted">{resolvedTheme}</span>
    </div>
  );
}
