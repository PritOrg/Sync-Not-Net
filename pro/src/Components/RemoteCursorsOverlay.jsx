/**
 * Remote Cursors Overlay Component
 * Phase 4: Remote Cursor Rendering
 * 
 * Renders remote user cursors in Monaco editor with:
 * - User name labels
 * - Colored cursor markers
 * - Selection highlights
 * - Throttled updates
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  Tooltip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// Generate consistent color for a user based on their ID
export const generateUserColor = (userId) => {
  if (!userId) return '#6366f1';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Generate light version of color for backgrounds
export const generateUserColorLight = (userId) => {
  if (!userId) return 'rgba(99, 102, 241, 0.15)';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsla(${hue}, 70%, 50%, 0.15)`;
};

// Single cursor component
const RemoteCursor = ({ user, position, editorRef }) => {
  const [pixelPosition, setPixelPosition] = useState(null);
  const color = useMemo(() => generateUserColor(user?.id), [user?.id]);

  useEffect(() => {
    if (!editorRef?.current || !position) return;

    const updatePixelPosition = () => {
      const editor = editorRef.current;
      if (!editor) return;

      try {
        // Convert line/column to pixel coordinates
        const coords = editor.getScrolledVisiblePosition({
          lineNumber: position.line,
          column: position.column
        });

        if (coords) {
          setPixelPosition({
            top: coords.top,
            left: coords.left,
            height: coords.height
          });
        }
      } catch (e) {
        // Position might be out of range
        setPixelPosition(null);
      }
    };

    updatePixelPosition();

    // Update on scroll or content change
    const disposable = editorRef.current?.onDidScrollChange?.(() => {
      updatePixelPosition();
    });

    return () => {
      disposable?.dispose?.();
    };
  }, [editorRef, position]);

  if (!pixelPosition || !user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      style={{
        position: 'absolute',
        top: pixelPosition.top,
        left: pixelPosition.left,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {/* Cursor line */}
      <div
        style={{
          width: 2,
          height: pixelPosition.height || 18,
          backgroundColor: color,
          borderRadius: 1,
          animation: 'cursorBlink 1s infinite',
        }}
      />
      {/* User label */}
      <div
        style={{
          position: 'absolute',
          top: -22,
          left: 0,
          backgroundColor: color,
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px 4px 4px 0',
          fontSize: '11px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          boxShadow: `0 2px 4px ${alpha(color, 0.3)}`,
        }}
      >
        {user.name || 'Anonymous'}
      </div>
    </motion.div>
  );
};

// Selection highlight component
const RemoteSelection = ({ user, selection, editorRef }) => {
  const [decorations, setDecorations] = useState([]);
  const color = useMemo(() => generateUserColor(user?.id), [user?.id]);
  const colorLight = useMemo(() => generateUserColorLight(user?.id), [user?.id]);

  useEffect(() => {
    if (!editorRef?.current || !selection) return;

    const editor = editorRef.current;
    const monaco = window.monaco;
    if (!monaco) return;

    // Create decoration for selection highlight
    const newDecorations = editor.deltaDecorations(
      decorations,
      [{
        range: new monaco.Range(
          selection.startLine,
          selection.startColumn,
          selection.endLine,
          selection.endColumn
        ),
        options: {
          className: `remote-selection-${user?.id}`,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        }
      }]
    );

    setDecorations(newDecorations);

    // Inject CSS for this user's selection
    const styleId = `remote-selection-style-${user?.id}`;
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .remote-selection-${user?.id} {
          background-color: ${colorLight} !important;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      editor.deltaDecorations(newDecorations, []);
    };
  }, [editorRef, selection, user?.id, color, colorLight]);

  return null; // Decorations are rendered by Monaco directly
};

// Main RemoteCursorsOverlay component
const RemoteCursorsOverlay = ({
  cursors = [],
  editorRef,
  currentUserId,
  mode = 'code' // Only show in code mode
}) => {
  const theme = useTheme();
  const containerRef = useRef(null);

  // Filter out current user's cursor
  const remoteCursors = useMemo(() => {
    return cursors.filter(c => c.user?.id !== currentUserId);
  }, [cursors, currentUserId]);

  // Don't render if not in code mode or no remote cursors
  if (mode !== 'code' || remoteCursors.length === 0) {
    return null;
  }

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      {/* Cursor animations keyframes */}
      <style>
        {`
          @keyframes cursorBlink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.4; }
          }
        `}
      </style>

      <AnimatePresence>
        {remoteCursors.map((cursor) => (
          <React.Fragment key={cursor.user?.id || Math.random()}>
            {/* Cursor marker */}
            <RemoteCursor
              user={cursor.user}
              position={cursor.position}
              editorRef={editorRef}
            />
            {/* Selection highlight */}
            {cursor.selection && (
              <RemoteSelection
                user={cursor.user}
                selection={cursor.selection}
                editorRef={editorRef}
              />
            )}
          </React.Fragment>
        ))}
      </AnimatePresence>

      {/* Active users indicator */}
      {remoteCursors.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            bgcolor: alpha(theme.palette.background.paper, 0.9),
            backdropFilter: 'blur(10px)',
            borderRadius: 2,
            px: 2,
            py: 1,
            boxShadow: theme.shadows[4],
          }}
        >
          {remoteCursors.slice(0, 5).map((cursor) => (
            <Tooltip key={cursor.user?.id} title={cursor.user?.name || 'Anonymous'} arrow>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '0.75rem',
                  bgcolor: generateUserColor(cursor.user?.id),
                  border: `2px solid ${theme.palette.background.paper}`,
                  marginLeft: '-8px',
                  '&:first-of-type': { marginLeft: 0 },
                }}
              >
                {(cursor.user?.name || 'A')[0].toUpperCase()}
              </Avatar>
            </Tooltip>
          ))}
          {remoteCursors.length > 5 && (
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              +{remoteCursors.length - 5} more
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            editing
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// Hook for managing cursor state
export const useRemoteCursors = (socketClient, notebookId, currentUserId) => {
  const [cursors, setCursors] = useState([]);
  const lastSentPosition = useRef(null);
  const throttleTimer = useRef(null);
  const THROTTLE_MS = 50;

  // Listen for remote cursor updates
  useEffect(() => {
    if (!socketClient?.isConnected) return;

    const handleUserCursorPosition = (data) => {
      if (!data?.user || !data?.position) return;

      setCursors(prev => {
        const existing = prev.findIndex(c => c.user?.id === data.user.id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = {
            user: data.user,
            position: data.position,
            selection: data.selection,
            timestamp: data.timestamp
          };
          return updated;
        }
        return [...prev, {
          user: data.user,
          position: data.position,
          selection: data.selection,
          timestamp: data.timestamp
        }];
      });
    };

    const handleUserLeft = (data) => {
      setCursors(prev => prev.filter(c => c.user?.id !== data.userId));
    };

    socketClient.on('userCursorPosition', handleUserCursorPosition);
    socketClient.on('userLeft', handleUserLeft);

    return () => {
      socketClient.off('userCursorPosition', handleUserCursorPosition);
      socketClient.off('userLeft', handleUserLeft);
    };
  }, [socketClient?.isConnected]);

  // Send cursor position (throttled)
  const sendCursorPosition = useCallback((position, selection = null) => {
    if (!socketClient?.isConnected || !notebookId) return;

    // Throttle updates
    if (throttleTimer.current) {
      clearTimeout(throttleTimer.current);
    }

    throttleTimer.current = setTimeout(() => {
      // Only send if position changed
      const posStr = JSON.stringify(position);
      if (posStr === lastSentPosition.current) return;

      lastSentPosition.current = posStr;
      socketClient.emit('cursorPosition', {
        notebookId,
        position,
        selection
      });
    }, THROTTLE_MS);
  }, [socketClient?.isConnected, notebookId]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, []);

  // Remove stale cursors (no update for 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setCursors(prev =>
        prev.filter(c => {
          const lastUpdate = new Date(c.timestamp).getTime();
          return now - lastUpdate < 30000;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    cursors: cursors,
    sendCursorPosition,
    clearCursors: () => setCursors([])
  };
};

export default RemoteCursorsOverlay;
