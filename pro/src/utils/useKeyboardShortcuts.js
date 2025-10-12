import { useEffect } from 'react';
import { KeyboardShortcuts, registerKeyboardShortcut } from './keyboardShortcuts';

const useKeyboardShortcuts = (handlers, disabled = false) => {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event) => {
      // Don't handle shortcuts when typing in input fields
      if (['input', 'textarea'].includes(event.target.tagName.toLowerCase()) ||
          event.target.isContentEditable) {
        return;
      }

      // Try each handler
      for (const [shortcut, handler] of Object.entries(handlers)) {
        if (KeyboardShortcuts[shortcut]) {
          const wasHandled = registerKeyboardShortcut(event, KeyboardShortcuts[shortcut], handler);
          if (wasHandled) break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, disabled]);
};

export default useKeyboardShortcuts;