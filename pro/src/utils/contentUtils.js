/**
 * Utility functions for handling notebook content format on the frontend
 * Handles extraction of plain content from XML format received from backend
 */

/**
 * Extracts plain content from XML format
 * @param {string} xmlContent - XML-formatted content from backend
 * @returns {string} Plain text content for editor
 */
export function extractContentFromXML(xmlContent) {
  if (!xmlContent) {
    return '';
  }

  // Check if content is in XML format
  if (!xmlContent.includes('<VSCode.Cell') && !xmlContent.includes('<vscode.cell')) {
    return xmlContent; // Already plain text
  }

  try {
    // Extract content between XML tags
    const cellRegex = /<VSCode\.Cell[^>]*>([\s\S]*?)<\/VSCode\.Cell>/gi;
    const matches = xmlContent.match(cellRegex);
    
    if (!matches || matches.length === 0) {
      return xmlContent; // Return original if no matches
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
  } catch (error) {
    console.warn('Error extracting content from XML:', error);
    return xmlContent; // Return original content if extraction fails
  }
}

/**
 * Unescapes XML content for display in editor
 * @param {string} content - XML-escaped content
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
 * Parses XML content to extract cell metadata
 * @param {string} xmlContent - XML content to parse
 * @returns {Object} Cell metadata
 */
export function parseXMLMetadata(xmlContent) {
  if (!xmlContent || !xmlContent.includes('<VSCode.Cell')) {
    return { cells: [] };
  }

  try {
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
  } catch (error) {
    console.warn('Error parsing XML metadata:', error);
    return { cells: [] };
  }
}

/**
 * Validates XML content structure
 * @param {string} xmlContent - XML content to validate
 * @returns {boolean} True if valid XML structure
 */
export function validateXMLStructure(xmlContent) {
  if (!xmlContent) return false;
  
  // Check for basic XML structure
  const hasOpeningTag = xmlContent.includes('<VSCode.Cell');
  const hasClosingTag = xmlContent.includes('</VSCode.Cell>');
  
  return hasOpeningTag && hasClosingTag;
}

/**
 * Prepares content for sending to backend
 * The backend will handle XML conversion, so we send plain content
 * @param {string} content - Plain content from editor
 * @returns {string} Content ready for backend
 */
export function prepareContentForBackend(content) {
  // Just return plain content - backend will handle XML conversion
  return content || '';
}

/**
 * Processes content received from backend
 * @param {string} content - Content from backend (might be XML or plain)
 * @returns {string} Plain content for editor
 */
export function processContentFromBackend(content) {
  return extractContentFromXML(content);
}
