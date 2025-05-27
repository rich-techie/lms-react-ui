// src/components/common/__tests__/FlashMessage.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor, act, waitForElementToBeRemoved } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';

import FlashMessage from '../FlashMessage';

describe('FlashMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to control its behavior in tests
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers(); // Restore real timers after each test
  });

  test('does not render when message is null or empty', () => {
    const { container } = render(<FlashMessage message={null} type="success" onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();

    const { container: containerEmpty } = render(<FlashMessage message="" type="success" onClose={vi.fn()} />);
    expect(containerEmpty).toBeEmptyDOMElement();
  });

  test('renders success message correctly', () => {
    const message = 'Operation successful!';
    render(<FlashMessage message={message} type="success" onClose={vi.fn()} />);

    const messageElement = screen.getByText(message);
    // Find the closest ancestor div that has the styling classes
    const alertContainer = messageElement.closest('div.position-fixed');

    expect(alertContainer).toBeInTheDocument();
    expect(alertContainer).toHaveClass('bg-success');
    expect(alertContainer).toHaveClass('text-white');
  });

  test('renders danger message correctly', () => {
    const message = 'An error occurred!';
    render(<FlashMessage message={message} type="danger" onClose={vi.fn()} />);

    const messageElement = screen.getByText(message);
    // Find the closest ancestor div that has the styling classes
    const alertContainer = messageElement.closest('div.position-fixed');

    expect(alertContainer).toBeInTheDocument();
    expect(alertContainer).toHaveClass('bg-danger');
    expect(alertContainer).toHaveClass('text-white');
  });

  test('calls onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();
    render(<FlashMessage message="Test message" type="success" onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('message disappears after 5 seconds', async () => {
    const message = 'Temporary message';
    const mockOnClose = vi.fn();

    // 1. Render the component initially with a message
    const { rerender } = render(<FlashMessage message={message} type="success" onClose={mockOnClose} />);

    // Assert it's initially in the document
    expect(screen.getByText(message)).toBeInTheDocument();

    // 2. Advance all pending timers. This will trigger the setTimeout inside FlashMessage, calling mockOnClose.
    act(() => {
      vi.runAllTimers();
    });

    // 3. Ensure mockOnClose was called by the component's internal timer
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // 4. Simulate the parent component reacting to onClose by no longer rendering FlashMessage.
    // This causes the FlashMessage component to unmount (return null).
    rerender(<FlashMessage message={null} type="success" onClose={mockOnClose} />);

    // 5. Assert that the message is no longer in the document.
    // We don't need waitForElementToBeRemoved here because the rerender is a direct, synchronous action.
    expect(screen.queryByText(message)).not.toBeInTheDocument();
  });
});
