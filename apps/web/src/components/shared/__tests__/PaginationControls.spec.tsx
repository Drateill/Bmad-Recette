import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginationControls from '../PaginationControls';

describe('PaginationControls', () => {
  it('does not render when totalPages is 1 or less', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders all page numbers when totalPages <= 7', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders ellipsis when totalPages > 7', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={10}
        onPageChange={vi.fn()}
      />
    );

    const ellipses = screen.getAllByText('...');
    expect(ellipses.length).toBeGreaterThan(0);
  });

  it('highlights current page', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-brand-primary');
  });

  it('disables previous button on first page', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange with correct page number', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={2}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const page3Button = screen.getByText('3');
    fireEvent.click(page3Button);

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange for previous button', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange for next button', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={onPageChange}
      />
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(onPageChange).toHaveBeenCalledWith(4);
  });
});
