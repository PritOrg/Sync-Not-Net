## Sync Not Net: Where Code Meets Poetry

In a world where code and prose were once sworn enemies, one hero dared to dream of a union between the two. Behold, Sync Not Net, the revolutionary tool that transforms your Notepad vibes into a Code Editor paradise!

### Project Context

Sync Not Net is a MERN (MongoDB, Express, React, Node.js) stack application designed to bridge the gap between creative writing and coding. The application allows users to write in a Notepad-like interface and seamlessly convert their text into a Code Editor interface using the powerful Monaco Editor. This unique approach helps users focus on writing without the distractions of a traditional code editor, and then transition smoothly into a coding environment.

### Technologies and APIs

- **Frontend**: React.js with Monaco Editor for the code editing interface.
  - Monaco Editor provides advanced features like syntax highlighting, auto-completion, and more.
- **Backend**: Node.js with Express.js for handling server-side logic and API endpoints.
- **Database**: MongoDB for storing user data and session information.
- **APIs**:
  - RESTful APIs for managing user sessions, data storage, and conversion between Notepad and Code Editor interfaces.

### Installation

To get started with Sync Not Net, follow these steps:

1. **Clone the Repository , and start play with it !**:
   ```bash
   git clone https://github.com/PritOrg/Sync-Not-Net.git
   npm install
   npm start
   ```
4. **Open in Browser**:
   Navigate to `http://localhost:3000` in your web browser.

### Usage

1. **Write in Notepad Interface**:
   - Start writing your text in the Notepad-like interface.
2. **Convert to Code Editor**:
   - Click the "Sync" button to convert your text into a Code Editor interface.
3. **Edit in Monaco Editor**:
   - Use the Monaco Editor interface to edit your code with features like syntax highlighting and auto-completion.
4. **Repeat as Needed**:
   - Switch back and forth between the Notepad and Code Editor interfaces as required.

### Features

- **Notepad-like Interface**: Write without the distractions of a traditional code editor.
- **Monaco Editor Integration**: Seamlessly convert your text into a powerful code editing environment.
- **Syntax Highlighting and Auto-completion**: Advanced coding features to enhance your development experience.
- **User Session Management**: Store and manage user sessions using MongoDB.

### Codebase Review

The codebase is structured as follows:

- **Frontend**:
  - `src/components`: React components for the Notepad and Code Editor interfaces.
  - `src/utils`: Utility functions for converting text between interfaces.
- **Backend**:
  - `server/models`: MongoDB schema definitions.
  - `server/routes`: Express.js routes for API endpoints.
  - `server/app.js`: Main server application file.
- **API Endpoints**:
  - `/api/sessions`: Manage user sessions.
  - `/api/convert`: Convert text between Notepad and Code Editor interfaces.


For more detailed troubleshooting, you can refer to the issue tracker on the GitHub repository.

---

This README provides a comprehensive overview of the project, its context, technologies, installation, usage, and contribution guidelines. It should help new contributors and users understand and get started with Sync Not Net effectively.
