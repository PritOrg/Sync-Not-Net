const mongoose = require('mongoose');
const Notebook = require('./models/notebookModel');
const User = require('./models/userModel');
require('dotenv').config();

async function createTestNotebook() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sync-not-net', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'test@example.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        tier: 'premium'
      });
      await testUser.save();
      console.log('Created test user');
    }

    // Create a public test notebook
    const testNotebook = new Notebook({
      title: 'Public Test Notebook for Guests',
      content: 'This is a test notebook that guests can access and edit. Feel free to collaborate!',
      creatorID: testUser._id,
      permissions: 'everyone',
      urlIdentifier: 'guest-test-notebook',
      editorMode: 'quill',
      autoSave: true,
      tags: ['test', 'public', 'guest-collaboration']
    });

    await testNotebook.save();
    console.log('Created test public notebook with URL: guest-test-notebook');

    // Create a password-protected public notebook
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('testpass', 12);
    
    const passwordNotebook = new Notebook({
      title: 'Password Protected Public Notebook',
      content: 'This notebook requires a password (testpass) but allows guest collaboration.',
      creatorID: testUser._id,
      permissions: 'everyone',
      password: hashedPassword,
      urlIdentifier: 'password-test-notebook',
      editorMode: 'quill',
      autoSave: true,
      tags: ['test', 'password-protected', 'guest-collaboration']
    });

    await passwordNotebook.save();
    console.log('Created password-protected test notebook with URL: password-test-notebook (password: testpass)');

    console.log('\nTest notebooks created successfully!');
    console.log('- Public notebook: http://localhost:3000/notebook/guest-test-notebook');
    console.log('- Password notebook: http://localhost:3000/notebook/password-test-notebook (password: testpass)');

  } catch (error) {
    console.error('Error creating test notebook:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestNotebook();
