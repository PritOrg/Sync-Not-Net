const { 
  convertToXMLFormat, 
  extractContentFromXML, 
  updateXMLContent,
  generateEmptyXMLContent,
  validateXMLStructure,
  parseXMLMetadata
} = require('./utils/notebookFormatUtils');

console.log('Testing XML format utilities...\n');

// Test 1: Convert plain text to XML
console.log('Test 1: Convert plain text to XML');
const plainText = 'console.log("Hello, World!");';
const xmlContent = convertToXMLFormat(plainText, 'javascript', 'monaco');
console.log('Plain text:', plainText);
console.log('XML content:', xmlContent);
console.log('Valid XML:', validateXMLStructure(xmlContent));
console.log('');

// Test 2: Extract content from XML
console.log('Test 2: Extract content from XML');
const extractedContent = extractContentFromXML(xmlContent);
console.log('Extracted content:', extractedContent);
console.log('Content matches:', extractedContent === plainText);
console.log('');

// Test 3: Update XML content
console.log('Test 3: Update XML content');
const newText = 'print("Hello, Python!")';
const updatedXML = updateXMLContent(xmlContent, newText, 'python', 'monaco');
console.log('Updated XML:', updatedXML);
console.log('');

// Test 4: Generate empty XML
console.log('Test 4: Generate empty XML');
const emptyXML = generateEmptyXMLContent('typescript');
console.log('Empty XML:', emptyXML);
console.log('');

// Test 5: Parse XML metadata
console.log('Test 5: Parse XML metadata');
const metadata = parseXMLMetadata(xmlContent);
console.log('Metadata:', JSON.stringify(metadata, null, 2));
console.log('');

// Test 6: Handle non-XML content
console.log('Test 6: Handle non-XML content');
const nonXmlText = 'This is just plain text';
const extractedNonXml = extractContentFromXML(nonXmlText);
console.log('Non-XML text:', nonXmlText);
console.log('Extracted (should be same):', extractedNonXml);
console.log('Content matches:', extractedNonXml === nonXmlText);
console.log('');

console.log('All tests completed!');
