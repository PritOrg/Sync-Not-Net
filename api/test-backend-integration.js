const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000';

async function testNotebookCreation() {
  console.log('Testing notebook creation with XML format...\n');
  
  try {
    // Test 1: Create a notebook with JavaScript code
    console.log('Test 1: Creating notebook with JavaScript content');
    const createResponse = await fetch(`${API_BASE_URL}/api/notebooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-testing' // This will create a guest notebook
      },
      body: JSON.stringify({
        title: 'Test XML Notebook',
        content: 'console.log("Hello from XML format!");',
        editorMode: 'monaco',
        language: 'javascript',
        permissions: 'everyone'
      })
    });
    
    if (!createResponse.ok) {
      console.log('Create response status:', createResponse.status);
      const errorData = await createResponse.text();
      console.log('Create error:', errorData);
    } else {
      const createData = await createResponse.json();
      console.log('Created notebook:', createData.notebook.title);
      console.log('Content returned:', createData.notebook.content);
      console.log('URL identifier:', createData.notebook.urlIdentifier);
      
      // Test 2: Retrieve the notebook
      console.log('\nTest 2: Retrieving notebook');
      const retrieveResponse = await fetch(`${API_BASE_URL}/api/notebooks/${createData.notebook.urlIdentifier}`);
      
      if (retrieveResponse.ok) {
        const retrieveData = await retrieveResponse.json();
        console.log('Retrieved content:', retrieveData.content);
        console.log('Content matches:', retrieveData.content === 'console.log("Hello from XML format!");');
      } else {
        console.log('Retrieve failed:', await retrieveResponse.text());
      }
      
      // Test 3: Update the notebook
      console.log('\nTest 3: Updating notebook');
      const updateResponse = await fetch(`${API_BASE_URL}/api/notebooks/${createData.notebook._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: 'console.log("Updated content with XML format!");',
          language: 'javascript'
        })
      });
      
      if (updateResponse.ok) {
        const updateData = await updateResponse.json();
        console.log('Updated content:', updateData.notebook.content);
        console.log('Update matches:', updateData.notebook.content === 'console.log("Updated content with XML format!");');
      } else {
        console.log('Update failed:', await updateResponse.text());
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testNotebookCreation();
