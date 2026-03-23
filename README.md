## Sync Not Net

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

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PritOrg/Sync-Not-Net.git
   cd Sync-Not-Net
   ```
2. **Run the setup step once if you want dependencies and env files prepared without starting the apps**:
   ```bash
   npm run setup
   ```
3. **Start the full project from the repo root**:
   ```bash
   npm start
   ```
4. **Open in browser**:
   Navigate to `http://localhost:3000` in your web browser.

### Root Commands

- `npm start`: cross-platform root launcher for backend and frontend.
- `npm run setup`: installs missing dependencies and creates missing local env files.
- `npm run stop`: stops backend and frontend started by the root launcher.

### Startup Notes

- The backend runs on `http://localhost:5000`.
- The frontend runs on `http://localhost:3000`.
- If `api/.env` is missing, it is copied from `api/.env.example`.
- If `pro/.env` is missing, it is created with `REACT_APP_BACKEND_URL=http://localhost:5000`.
- If port `3000` or `5000` is already in use, `npm start` exits early with a clear error instead of partially starting the project.

### Troubleshooting

- If startup says a port is already in use, stop the process already bound to `3000` or `5000`, then run `npm start` again.
- If you previously launched the apps from the repo root, run `npm run stop` before starting again.
- If backend startup still fails after ports are free, review your local `api/.env` values, especially `MONGODB_URI`, `JWT_SECRET`, `PORT`, and `CORS_ORIGIN`.

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
