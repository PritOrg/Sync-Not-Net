import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Toolbar,
  IconButton,
  Tooltip,
  Typography,
  Divider,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import {
  Save as SaveIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Code as CodeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 22, 24];

const EnhancedEditor = ({
  content = '',
  onChange,
  onSave,
  editorMode = 'rich', // 'rich' or 'code'
  onModeChange, // New prop to handle mode changes
  language = 'javascript',
  onLanguageChange, // New prop to handle language changes
  readOnly = false,
  autoSave = true,
  placeholder = 'Start writing...',
}) => {
  const theme = useTheme();
  const [mode, setMode] = useState(editorMode);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [fontSize, setFontSize] = useState(14);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // Sync mode with prop changes
  useEffect(() => {
    setMode(editorMode);
  }, [editorMode]);

  // Sync language with prop changes
  useEffect(() => {
    setSelectedLanguage(language);
  }, [language]);

  // Note: Auto-save functionality is handled by the parent component (NotebookEditorPage)
  // This component only handles manual saves when the user explicitly clicks save

  const handleModeChange = useCallback((event, newMode) => {
    if (newMode !== null && !readOnly) {
      // We'll call the parent's onModeChange which should use handleEditorSwitch
      if (onModeChange) {
        onModeChange(newMode);
      } else {
        // Fallback if no parent handler is provided
        setMode(newMode);
      }
    }
  }, [onModeChange, readOnly]);

  const handleLanguageChange = useCallback((event) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  }, [onLanguageChange]);

  const handleFontSizeChange = useCallback((event) => {
    setFontSize(event.target.value);
  }, []);

  // Setup language-specific features (separate function for reusability)
  const setupLanguageFeatures = useCallback((monaco) => {
    if (!monaco) return;

    // JavaScript/TypeScript specific features
    if (selectedLanguage === 'javascript' || selectedLanguage === 'typescript') {
      monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ESNext,
          allowNonTsExtensions: true,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.CommonJS,
          noEmit: true,
          esModuleInterop: true,
          jsx: monaco.languages.typescript.JsxEmit.React,
          reactNamespace: 'React',
          allowJs: true,
          typeRoots: ['node_modules/@types']
        });

        // Add common libraries
        monaco.languages.typescript.javascriptDefaults.addExtraLib(`
          declare var console: {
            log(message?: any, ...optionalParams: any[]): void;
            error(message?: any, ...optionalParams: any[]): void;
            warn(message?: any, ...optionalParams: any[]): void;
            info(message?: any, ...optionalParams: any[]): void;
          };
          declare var window: any;
          declare var document: any;
          declare var localStorage: any;
          declare var sessionStorage: any;
          declare var fetch: any;
          declare var Promise: any;
          declare var setTimeout: any;
          declare var setInterval: any;
          declare var clearTimeout: any;
          declare var clearInterval: any;
        `, 'global.d.ts');
      }

      // Python specific features
      if (selectedLanguage === 'python') {
        monaco.languages.registerCompletionItemProvider('python', {
          provideCompletionItems: (model, position) => {
            const suggestions = [
              {
                label: 'print',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'print(${1:message})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print function'
              },
              {
                label: 'len',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'len(${1:object})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Return the length of an object'
              },
              {
                label: 'range',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'range(${1:start}, ${2:stop})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Range function'
              },
              {
                label: 'for loop',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for ${1:item} in ${2:iterable}:\n    ${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'For loop'
              },
              {
                label: 'if statement',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'if ${1:condition}:\n    ${2:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'If statement'
              },
              {
                label: 'def function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'def ${1:function_name}(${2:parameters}):\n    ${3:pass}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Function definition'
              }
            ];
            return { suggestions };
          }
        });
      }

      // Java specific features
      if (selectedLanguage === 'java') {
        monaco.languages.registerCompletionItemProvider('java', {
          provideCompletionItems: (model, position) => {
            const suggestions = [
              {
                label: 'System.out.println',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'System.out.println(${1:message});',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Print to console'
              },
              {
                label: 'public class',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'public class ${1:ClassName} {\n    ${2:// code here}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Public class declaration'
              },
              {
                label: 'main method',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'public static void main(String[] args) {\n    ${1:// code here}\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Main method'
              }
            ];
            return { suggestions };
          }
        });
      }

      // C++ specific features
      if (selectedLanguage === 'cpp') {
        monaco.languages.registerCompletionItemProvider('cpp', {
          provideCompletionItems: (model, position) => {
            const suggestions = [
              {
                label: 'iostream',
                kind: monaco.languages.CompletionItemKind.Module,
                insertText: '#include <iostream>',
                documentation: 'Include iostream header'
              },
              {
                label: 'cout',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'std::cout << ${1:message} << std::endl;',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Output to console'
              },
              {
                label: 'cin',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'std::cin >> ${1:variable};',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Input from console'
              },
              {
                label: 'main function',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'int main() {\n    ${1:// code here}\n    return 0;\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Main function'
              }
            ];
            return { suggestions };
          }
        });
      }
  }, [selectedLanguage]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave({}, true); // Pass empty settings and true for manual save
      setLastSaved(new Date());
    }
  }, [onSave]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Configure Monaco editor for light theme only
    monaco.editor.defineTheme('custom-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e293b',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#e2e8f0',
        'editor.inactiveSelectionBackground': '#f1f5f9',
      }
    });

    // Always use light theme
    monaco.editor.setTheme('custom-light');

    // Setup language features
    setupLanguageFeatures(monaco);
  }, [setupLanguageFeatures]);

  // Effect to re-setup language features when language changes
  useEffect(() => {
    if (editorRef.current && window.monaco) {
      setupLanguageFeatures(window.monaco);
      
      // Also update the editor language if it exists
      const model = editorRef.current.getModel();
      if (model) {
        window.monaco.editor.setModelLanguage(model, selectedLanguage);
      }
    }
  }, [selectedLanguage, setupLanguageFeatures]);

  // Quill modules configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['blockquote', 'code-block'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'indent',
    'align', 'link', 'image', 'video', 'blockquote', 'code-block'
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
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: isFullscreen ? 0 : 2,
      }}
    >
      {/* Toolbar */}
      <Toolbar
        variant="dense"
        sx={{
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          minHeight: '48px !important',
          gap: 2,
        }}
      >
        {/* Editor Mode Toggle */}
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={handleModeChange}
          size="small"
          disabled={readOnly}
          sx={{
            '& .MuiToggleButton-root': {
              px: 2,
              py: 0.5,
              fontSize: '0.75rem',
              fontWeight: 500,
            }
          }}
        >
          <ToggleButton value="rich" aria-label="rich text editor">
            <EditIcon fontSize="small" sx={{ mr: 0.5 }} />
            Rich
          </ToggleButton>
          <ToggleButton value="code" aria-label="code editor">
            <CodeIcon fontSize="small" sx={{ mr: 0.5 }} />
            Code
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider orientation="vertical" flexItem />

        {/* Language Selector (Code Mode Only) */}
        {mode === 'code' && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              displayEmpty
              disabled={readOnly}
              renderValue={(value) => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.value === value);
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{lang?.icon}</span>
                    <Typography variant="body2">{lang?.label}</Typography>
                  </Box>
                );
              }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <MenuItem key={lang.value} value={lang.value}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{lang.icon}</span>
                    <Typography variant="body2">{lang.label}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Font Size Selector */}
        <FormControl size="small" sx={{ minWidth: 80 }}>
          <Select
            value={fontSize}
            onChange={handleFontSizeChange}
            displayEmpty
          >
            {FONT_SIZES.map((size) => (
              <MenuItem key={size} value={size}>
                {size}px
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flexGrow: 1 }} />

        {/* Status */}
        {lastSaved && (
          <Chip
            label={`Saved ${lastSaved.toLocaleTimeString()}`}
            size="small"
            color="success"
            variant="outlined"
          />
        )}

        {/* Actions */}
        <Tooltip title="Save">
          <IconButton onClick={handleSave} size="small">
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <IconButton onClick={toggleFullscreen} size="small">
            {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Toolbar>

      {/* Editor Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
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
            style={{
              height: '100%',
              fontSize: `${fontSize}px`,
            }}
          />
        ) : (
          <Editor
            height="100%"
            language={selectedLanguage}
            value={content}
            onChange={onChange}
            onMount={handleEditorDidMount}
            theme="custom-light"
            options={{
              fontSize,
              readOnly,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'on',
              folding: true,
              bracketMatching: 'always',
              autoIndent: 'full',
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              insertSpaces: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              wordBasedSuggestions: true,
              snippetSuggestions: 'inline',
              parameterHints: true,
              suggestSelection: 'first',
              acceptSuggestionOnEnter: 'on',
              tabCompletion: 'on',
            }}
          />
        )}
      </Box>
    </Paper>
  );
};

export default EnhancedEditor;
