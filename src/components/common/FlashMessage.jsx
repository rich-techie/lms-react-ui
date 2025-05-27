// src/components/common/FlashMessage.jsx

import React, { useEffect } from 'react';
import { logDebug } from '../../utils/debugLogger'; // Ensure this import is correct

/**
 * Reusable Message Display Component.
 * @param {object} props - Component props.
 * @param {string} props.message - The message to display.
 * @param {'success' | 'danger'} props.type - The type of message (e.g., 'success', 'danger').
 * @param {function} props.onClose - Callback function to close the message.
 */
const FlashMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    logDebug('FlashMessage useEffect run. Message:', message); // Log when effect runs
    let timer;
    if (message) {
      timer = setTimeout(() => {
        logDebug('FlashMessage setTimeout callback firing!'); // Log when callback fires
        onClose();
      }, 5000);
    }

    return () => {
      if (timer) {
        logDebug('FlashMessage useEffect cleanup: Clearing timer', timer); // Log when cleanup clears timer
        clearTimeout(timer);
      } else {
        logDebug('FlashMessage useEffect cleanup: No timer to clear.'); // Log when cleanup runs but no timer
      }
    };
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-success' : 'bg-danger'; // Bootstrap colors
  const textColor = 'text-white';

  return (
    <div className={`position-fixed top-0 end-0 m-4 p-3 rounded shadow ${bgColor} ${textColor}`} style={{ zIndex: 1050 }}> {/* Bootstrap classes */}
      <span>{message}</span>
      <button type="button" className="btn-close btn-close-white ms-3" aria-label="Close" onClick={onClose}></button> {/* Bootstrap close button */}
    </div>
  );
};

export default FlashMessage;
