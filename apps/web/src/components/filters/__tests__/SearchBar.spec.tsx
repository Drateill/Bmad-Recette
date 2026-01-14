import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SearchBar from '../SearchBar';

describe('SearchBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders search input', () => {
    render(<SearchBar value="" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText('Search recipes...');
    expect(input).toBeInTheDocument();
  });

  it('displays initial value', () => {
    render(<SearchBar value="pizza" onChange={vi.fn()} />);

    const input = screen.getByPlaceholderText(
      'Search recipes...'
    ) as HTMLInputElement;
    expect(input.value).toBe('pizza');
  });

  it('debounces onChange callback', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={500} />);

    const input = screen.getByPlaceholderText('Search recipes...');

    // Type in the input
    fireEvent.change(input, { target: { value: 'chicken' } });

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // Fast-forward time by 500ms wrapped in act to handle state updates
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Now onChange should be called
    expect(onChange).toHaveBeenCalledWith('chicken');
  });

  it('shows loading indicator while debouncing', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={500} />);

    const input = screen.getByPlaceholderText('Search recipes...');

    // Note: This test triggers an act() warning due to async useEffect with fake timers.
    // This is a known limitation and doesn't affect production behavior.
    fireEvent.change(input, { target: { value: 'test' } });

    // Advance timers by 0 to allow microtasks to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    // Loading indicator should be visible
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('cancels previous debounce on new input', async () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} debounceMs={500} />);

    const input = screen.getByPlaceholderText('Search recipes...');

    // First input
    fireEvent.change(input, { target: { value: 'chi' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    // Second input before debounce completes
    fireEvent.change(input, { target: { value: 'chicken' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    // Only the last value should be propagated
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('chicken');
  });
});
