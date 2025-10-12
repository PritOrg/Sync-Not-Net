export const KeyboardShortcuts = {
  SAVE: { keys: ['Control+S', 'Meta+S'], description: 'Save notebook' },
  TOGGLE_AUTOSAVE: { keys: ['Control+Shift+S', 'Meta+Shift+S'], description: 'Toggle auto-save' },
  TOGGLE_EDITOR: { keys: ['Control+E', 'Meta+E'], description: 'Toggle editor mode' },
  SHOW_SHORTCUTS: { keys: ['Control+/', 'Meta+/'], description: 'Show keyboard shortcuts' },
  OPEN_SETTINGS: { keys: ['Control+,', 'Meta+,'], description: 'Open settings' },
  UNDO: { keys: ['Control+Z', 'Meta+Z'], description: 'Undo' },
  REDO: { keys: ['Control+Shift+Z', 'Meta+Shift+Z', 'Control+Y', 'Meta+Y'], description: 'Redo' },
};

export const isKeyboardShortcut = (event, shortcut) => {
  const isControl = event.ctrlKey || event.metaKey;
  const isShift = event.shiftKey;
  const key = event.key.toLowerCase();

  // Return true if the event matches any of the shortcut's key combinations
  return shortcut.keys.some(combination => {
    const parts = combination.split('+');
    const keyMatch = parts[parts.length - 1].toLowerCase() === key;
    const controlMatch = parts.includes('Control') || parts.includes('Meta') ? isControl : !isControl;
    const shiftMatch = parts.includes('Shift') ? isShift : !isShift;
    return keyMatch && controlMatch && shiftMatch;
  });
};

export const registerKeyboardShortcut = (event, shortcut, callback) => {
  if (isKeyboardShortcut(event, shortcut)) {
    event.preventDefault();
    callback(event);
    return true;
  }
  return false;
};