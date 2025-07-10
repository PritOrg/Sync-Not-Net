const crypto = require('crypto');

/**
 * Utility functions for handling notebook content format conversion
 * Ensures notebooks are saved in XML-based format with VSCode.Cell tags
 */

/**
 * Converts any content to XML-based VSCode.Cell format
 * @param {string} content - The content to convert
 * @param {string} language - The programming language
 * @param {string} editorMode - The editor mode ('monaco' or 'quill')
 * @returns {string} XML-formatted content
 */
function convertToXMLFormat(content, language = 'javascript', editorMode = 'monaco') {
  if (!content) {
    return generateEmptyXMLContent(language);
  }

  // Check if content is already in XML format
  if (content.includes('<VSCode.Cell') || content.includes('<vscode.cell')) {
    return content; // Already in XML format
  }

  // Generate unique cell ID
  const cellId = generateCellId();
  
  // Determine cell type based on editor mode
  const cellType = editorMode === 'monaco' ? 'code' : 'markdown';
  
  // Escape content for XML
  const escapedContent = escapeXMLContent(content);
  
  // Create XML structure
  const xmlContent = `<VSCode.Cell id="${cellId}" type="${cellType}" language="${language}">
${escapedContent}
</VSCode.Cell>`;

  return xmlContent;
}

/**
 * Extracts plain content from XML format
 * @param {string} xmlContent - XML-formatted content
 * @returns {string} Plain text content
 */
function extractContentFromXML(xmlContent) {
  if (!xmlContent) {
    return '';
  }

  // Check if content is in XML format
  if (!xmlContent.includes('<VSCode.Cell') && !xmlContent.includes('<vscode.cell')) {
    return xmlContent; // Already plain text
  }

  // Extract content between XML tags
  const cellRegex = /<VSCode\.Cell[^>]*>([\s\S]*?)<\/VSCode\.Cell>/gi;
  const matches = xmlContent.match(cellRegex);
  
  if (!matches || matches.length === 0) {
    return xmlContent;
  }

  // Extract and combine all cell contents
  let extractedContent = '';
  matches.forEach(match => {
    const contentMatch = match.match(/<VSCode\.Cell[^>]*>([\s\S]*?)<\/VSCode\.Cell>/i);
    if (contentMatch && contentMatch[1]) {
      const cellContent = unescapeXMLContent(contentMatch[1].trim());
      extractedContent += cellContent + '\n\n';
    }
  });

  return extractedContent.trim();
}

/**
 * Updates existing XML content with new content while preserving cell structure
 * @param {string} existingXML - Existing XML content
 * @param {string} newContent - New content to update
 * @param {string} language - Programming language
 * @param {string} editorMode - Editor mode
 * @returns {string} Updated XML content
 */
function updateXMLContent(existingXML, newContent, language = 'javascript', editorMode = 'monaco') {
  if (!existingXML || !existingXML.includes('<VSCode.Cell')) {
    // No existing XML structure, create new
    return convertToXMLFormat(newContent, language, editorMode);
  }

  // Parse existing XML to extract cell info
  const cellRegex = /<VSCode\.Cell\s+id="([^"]*)"[^>]*>([\s\S]*?)<\/VSCode\.Cell>/gi;
  const match = cellRegex.exec(existingXML);
  
  if (match) {
    const cellId = match[1];
    const cellType = editorMode === 'monaco' ? 'code' : 'markdown';
    const escapedContent = escapeXMLContent(newContent);
    
    // Update with preserved cell ID
    return `<VSCode.Cell id="${cellId}" type="${cellType}" language="${language}">
${escapedContent}
</VSCode.Cell>`;
  }

  // Fallback to creating new XML
  return convertToXMLFormat(newContent, language, editorMode);
}

/**
 * Generates an empty XML content structure
 * @param {string} language - Programming language
 * @returns {string} Empty XML content
 */
function generateEmptyXMLContent(language = 'javascript') {
  const cellId = generateCellId();
  return `<VSCode.Cell id="${cellId}" type="code" language="${language}">
// Start coding here...
</VSCode.Cell>`;
}

/**
 * Generates a unique cell ID
 * @returns {string} Unique cell ID
 */
function generateCellId() {
  return 'cell_' + crypto.randomBytes(8).toString('hex');
}

/**
 * Escapes content for XML format
 * @param {string} content - Content to escape
 * @returns {string} Escaped content
 */
function escapeXMLContent(content) {
  if (!content) return '';
  
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Unescapes XML content
 * @param {string} content - Content to unescape
 * @returns {string} Unescaped content
 */
function unescapeXMLContent(content) {
  if (!content) return '';
  
  return content
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Validates XML content structure
 * @param {string} xmlContent - XML content to validate
 * @returns {boolean} True if valid XML structure
 */
function validateXMLStructure(xmlContent) {
  if (!xmlContent) return false;
  
  // Check for basic XML structure
  const hasOpeningTag = xmlContent.includes('<VSCode.Cell');
  const hasClosingTag = xmlContent.includes('</VSCode.Cell>');
  
  return hasOpeningTag && hasClosingTag;
}

/**
 * Parses XML content to extract cell metadata
 * @param {string} xmlContent - XML content to parse
 * @returns {Object} Cell metadata
 */
function parseXMLMetadata(xmlContent) {
  if (!xmlContent || !xmlContent.includes('<VSCode.Cell')) {
    return { cells: [] };
  }

  const cellRegex = /<VSCode\.Cell\s+id="([^"]*)"(?:\s+type="([^"]*)")?(?:\s+language="([^"]*)")?[^>]*>([\s\S]*?)<\/VSCode\.Cell>/gi;
  const cells = [];
  let match;

  while ((match = cellRegex.exec(xmlContent)) !== null) {
    cells.push({
      id: match[1],
      type: match[2] || 'code',
      language: match[3] || 'javascript',
      content: unescapeXMLContent(match[4].trim())
    });
  }

  return { cells };
}

module.exports = {
  convertToXMLFormat,
  extractContentFromXML,
  updateXMLContent,
  generateEmptyXMLContent,
  generateCellId,
  escapeXMLContent,
  unescapeXMLContent,
  validateXMLStructure,
  parseXMLMetadata
};
