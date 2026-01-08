// Utility function to create a debounced resize observer
export const createDebouncedResizeObserver = (callback, delay = 16) => {
  let timeoutId;
  
  return new ResizeObserver((entries, observer) => {
    if (timeoutId) {
      window.cancelAnimationFrame(timeoutId);
    }
    
    timeoutId = window.requestAnimationFrame(() => {
      callback(entries, observer);
    });
  });
};