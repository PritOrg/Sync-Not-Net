import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha,
  Button,
  Stack,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Save as SaveIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Code as CodeIcon,
  Edit as EditIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatListBulleted as ListBulletIcon,
  FormatListNumbered as ListNumberIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  FormatQuote as QuoteIcon,
  Image as ImageIcon,
  Link as LinkIcon,
  TableChart as TableIcon,
  MoreHoriz as MoreIcon,
  KeyboardArrowDown as ChevronDownIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';
import RemoteCursorsOverlay from './RemoteCursorsOverlay';

const SUPPORTED_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'typescript', label: 'TypeScript', icon: '🔷' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'csharp', label: 'C#', icon: '🔷' },
  { value: 'php', label: 'PHP', icon: '🐘' },
  { value: 'ruby', label: 'Ruby', icon: '💎' },
  { value: 'go', label: 'Go', icon: '🐹' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'json', label: 'JSON', icon: '📋' },
  { value: 'xml', label: 'XML', icon: '📄' },
  { value: 'yaml', label: 'YAML', icon: '⚙️' },
  { value: 'markdown', label: 'Markdown', icon: '📝' },
  { value: 'sql', label: 'SQL', icon: '🗃️' },
  { value: 'bash', label: 'Bash', icon: '💻' },
  { value: 'powershell', label: 'PowerShell', icon: '🔵' },
  { value: 'dockerfile', label: 'Dockerfile', icon: '🐳' },
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32];

// Modern toolbar button component
const ToolbarBtn = ({ icon, label, onClick, active, disabled, small }) => (
  <Tooltip title={label} arrow>
    <span>
      <IconButton
        onClick={onClick}
        disabled={disabled}
        size={small ? 'small' : 'medium'}
        sx={{
          borderRadius: 1.5,
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active ? alpha('#000', 0.04) : 'transparent',
          '&:hover': {
            bgcolor: alpha('#000', 0.08),
          },
          '&:disabled': {
            color: 'text.disabled',
          },
          transition: 'all 0.15s ease',
        }}
      >
        {icon}
      </IconButton>
    </span>
  </Tooltip>
);

// Modern select component
const ModernSelect = ({ value, onChange, options, disabled, renderValue }) => (
  <FormControl size="small" disabled={disabled}>
    <Select
      value={value}
      onChange={onChange}
      renderValue={renderValue}
      sx={{
        borderRadius: 2,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha('#000', 0.1),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha('#000', 0.2),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: 'primary.main',
        },
        '& .MuiSelect-select': {
          py: 0.75,
          px: 1.5,
        },
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {option.icon && <span>{option.icon}</span>}
            <Typography variant="body2">{option.label}</Typography>
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

const EnhancedEditor = ({
  content = '',
  onChange,
  onSave,
  editorMode = 'rich',
  onModeChange,
  language = 'javascript',
  onLanguageChange,
  readOnly = false,
  autoSave = true,
  placeholder = 'Start writing...',
  // Phase 4: Remote cursor props
  remoteCursors = [],
  currentUserId = null,
  notebookId = null,
  socketClient = null,
}) => {
  const theme = useTheme();
  const [mode, setMode] = useState(editorMode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Strip HTML tags for code mode
  const stripHtmlTags = useCallback((html) => {
    if (!html) return '';
    let text = html;
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<p[^>]*>/gi, '');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/\n{2,}/g, '\n');
    return text.trim();
  }, []);

  // Calculate word and character count
  useEffect(() => {
    const text = mode === 'code' ? stripHtmlTags(content) : content.replace(/<[^>]+>/g, '');
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, [content, mode, stripHtmlTags]);

  // Handle save
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({}, true);
      setLastSaved(new Date());
    }
  }, [onSave]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
      if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, toggleFullscreen]);

  // Sync mode with props
  useEffect(() => {
    setMode(editorMode);
  }, [editorMode]);

  // Sync language with props
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // Strip HTML when switching to code mode
  useEffect(() => {
    if (mode === 'code' && content && /<[^>]+>/.test(content)) {
      const plain = stripHtmlTags(content);
      if (plain !== content && onChange) {
        onChange(plain);
      }
    }
  }, [mode, content, onChange, stripHtmlTags]);

  // Handle mode change
  const handleModeChange = useCallback((event, newMode) => {
    if (newMode !== null && !readOnly) {
      if (onModeChange) {
        onModeChange(newMode);
      } else {
        setMode(newMode);
      }
    }
  }, [onModeChange, readOnly]);

  // Handle language change
  const handleLanguageChange = useCallback((event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    if (onLanguageChange) onLanguageChange(newLanguage);
  }, [onLanguageChange]);

  // Setup language features for Monaco
  const setupLanguageFeatures = useCallback((monaco) => {
    if (!monaco) return;
    if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        allowJs: true,
      });
    }
  }, [selectedLanguage]);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monaco.editor.defineTheme('sync-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
        { token: 'keyword', foreground: '8b5cf6' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e293b',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#64748b',
        'editor.selectionBackground': '#c7d2fe',
        'editor.inactiveSelectionBackground': '#e0e7ff',
        'editor.lineHighlightBackground': '#f8fafc',
        'editorCursor.foreground': '#4f46e5',
        'editor.findMatchBackground': '#fef08a',
        'editor.findMatchHighlightBackground': '#fef9c3',
      },
    });
    monaco.editor.setTheme('sync-light');
    setupLanguageFeatures(monaco);
  }, [setupLanguageFeatures]);

  // Update language in Monaco editor
  useEffect(() => {
    if (editorRef.current && window.monaco) {
      setupLanguageFeatures(window.monaco);
      const model = editorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, selectedLanguage);
      }
    }
  }, [selectedLanguage, setupLanguageFeatures]);

  // Quill modules configuration
  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, 4, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ align: [] }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean'],
    ],
    clipboard: { matchVisual: false },
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image', 'blockquote', 'code-block',
  ];

  return (
    <Paper
      elevation={0}
      sx={{
        height: isFullscreen ? '100vh' : '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 'auto',
        bgcolor: '#ffffff',
        borderRadius: isFullscreen ? 0 : 2,
        overflow: 'hidden',
      }}
    >
      {/* Modern Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 0.5,
          px: 2,
          py: 1,
          borderBottom: '1px solid',
          borderColor: alpha('#000', 0.08),
          bgcolor: alpha('#f8fafc', 0.8),
        }}
      >
        {/* Mode Toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          disabled={readOnly}
          sx={{
            mr: 1,
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.75,
              borderRadius: '8px !important',
              border: 'none',
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              },
            },
          }}
        >
          <ToggleButton value="rich">
            <EditIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="body2" fontWeight={500}>Write</Typography>
          </ToggleButton>
          <ToggleButton value="code">
            <CodeIcon sx={{ fontSize: 18, mr: 0.5 }} />
            <Typography variant="body2" fontWeight={500}>Code</Typography>
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Language Selector (Code mode only) */}
        {mode === 'code' && (
          <ModernSelect
            value={selectedLanguage}
            onChange={handleLanguageChange}
            disabled={readOnly}
            options={SUPPORTED_LANGUAGES}
            renderValue={(value) => {
              const lang = SUPPORTED_LANGUAGES.find((l) => l.value === value);
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span>{lang?.icon}</span>
                  <Typography variant="body2">{lang?.label}</Typography>
                </Box>
              );
            }}
          />
        )}

        {/* Font Size */}
        <ModernSelect
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
          options={FONT_SIZES.map((s) => ({ value: s, label: `${s}px` }))}
          renderValue={(value) => `${value}px`}
        />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Formatting Tools (Rich text mode only) */}
        {mode === 'rich' && (
          <Stack direction="row" spacing={0.25}>
            <ToolbarBtn icon={<BoldIcon />} label="Bold (Ctrl+B)" small />
            <ToolbarBtn icon={<ItalicIcon />} label="Italic (Ctrl+I)" small />
            <ToolbarBtn icon={<UnderlineIcon />} label="Underline (Ctrl+U)" small />
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <ToolbarBtn icon={<ListBulletIcon />} label="Bullet List" small />
            <ToolbarBtn icon={<ListNumberIcon />} label="Numbered List" small />
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <ToolbarBtn icon={<QuoteIcon />} label="Quote" small />
            <ToolbarBtn icon={<LinkIcon />} label="Insert Link" small />
          </Stack>
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Status indicators */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 1 }}>
          <Chip
            label={`${wordCount} words`}
            size="small"
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              borderColor: alpha('#000', 0.1),
              fontSize: '0.75rem',
              height: 24,
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {charCount} chars
          </Typography>
        </Box>

        {/* Save button */}
        <Tooltip title="Save (Ctrl+S)" arrow>
          <span>
            <IconButton
              onClick={handleSave}
              disabled={readOnly}
              size="small"
              sx={{
                borderRadius: 1.5,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: alpha('#000', 0.08),
                },
              }}
            >
              <SaveIcon />
            </IconButton>
          </span>
        </Tooltip>

        {/* Fullscreen button */}
        <Tooltip title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Fullscreen (F11)'} arrow>
          <IconButton
            onClick={toggleFullscreen}
            size="small"
            sx={{
              borderRadius: 1.5,
              color: 'text.secondary',
              '&:hover': {
                bgcolor: alpha('#000', 0.08),
              },
            }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Editor Content */}
      <Box
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
          '& .ql-toolbar': {
            border: 'none',
            borderBottom: `1px solid ${alpha('#000', 0.08)}`,
            bgcolor: alpha('#fafafa', 0.5),
            fontFamily: 'inherit',
          },
          '& .ql-container': {
            border: 'none',
            fontFamily: 'inherit',
            fontSize: `${fontSize}px`,
          },
          '& .ql-editor': {
            px: { xs: 2, md: 4 },
            py: 3,
            lineHeight: 1.8,
            '&.ql-blank::before': {
              fontStyle: 'normal',
              color: 'text.disabled',
            },
          },
          '& .ql-editor p, & .ql-editor h1, & .ql-editor h2, & .ql-editor h3': {
            marginBottom: '0.5em',
          },
          '& .ql-snow .ql-stroke': {
            stroke: theme.palette.text.secondary,
          },
          '& .ql-snow .ql-fill': {
            fill: theme.palette.text.secondary,
          },
          '& .ql-snow .ql-picker': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        {mode === 'rich' ? (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={content}
            onChange={onChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder={placeholder}
            readOnly={readOnly}
            style={{ height: '100%' }}
          />
        ) : (
          <Editor
            height="100%"
            language={selectedLanguage}
            value={stripHtmlTags(content)}
            onChange={onChange}
            onMount={handleEditorDidMount}
            theme="sync-light"
            options={{
              fontSize,
              readOnly,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              bracketMatching: 'always',
              autoIndent: 'advanced',
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              wordBasedSuggestions: 'currentDocument',
              snippetSuggestions: 'inline',
              parameterHints: { enabled: true },
              suggestSelection: 'first',
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              scrollbar: {
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8,
                useShadows: false,
              },
            }}
          />
        )}

        {/* Phase 4: Remote Cursors Overlay */}
        <RemoteCursorsOverlay
          cursors={remoteCursors}
          editorRef={editorRef}
          currentUserId={currentUserId}
          mode={mode}
        />
      </Box>

      {/* Status Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 0.5,
          borderTop: '1px solid',
          borderColor: alpha('#000', 0.08),
          bgcolor: alpha('#f8fafc', 0.8),
          fontSize: '0.75rem',
          color: 'text.secondary',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption">
            {mode === 'code' ? selectedLanguage.toUpperCase() : 'Rich Text'}
          </Typography>
          {readOnly && (
            <Chip label="Read Only" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {mode === 'code' && (
            <Typography variant="caption">UTF-8 • LF</Typography>
          )}
          <Typography variant="caption">
            Ln {1}, Col {1}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default EnhancedEditor;
