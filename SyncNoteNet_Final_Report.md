# SyncNoteNet: A Collaborative Note-Taking and Code-Sharing Platform

## ACKNOWLEDGEMENT

I wish to express my sincere gratitude to my project guide and all the faculty members for helping me through my project by giving me the necessary suggestions and advice along with their valuable coordination in completing this work. Their technical support and academic direction helped shape the project from concept to implementation.

I also thank my parents, friends, and all the members of the family for their precious support and encouragement which they have provided in the completion of my work. In addition to that, I would also like to mention the institution personals who gave me the permission to use and experience the valuable resources required for the project from the campus premises.

Thus, in conclusion to the above said, I once again thank the faculties and members of my institution for their valuable support in the completion of the project.

**With Sincere Regards,**  
[Student Name]

---

## ABSTRACT

SyncNoteNet is a comprehensive collaborative note-taking and code-sharing web platform designed to seamlessly combine rich-text writing and code editing within a single, real-time workspace. Inspired by collaborative systems like Google Docs and Google Sheets, this platform specifically addresses the friction experienced in modern engineering and academic workflows where users must frequently alternate between disjointed documentation tools and coding environments. 

The system architecture is built upon a modern JavaScript full-stack ecosystem. The frontend is implemented using React 18, utilizing the Material UI component system for a responsive interface, while integrating the Quill editor for rich text and the Monaco editor for advanced code editing. The backend is powered by Node.js and Express.js, providing robust RESTful APIs. Persistent data storage is handled by MongoDB, while Socket.IO facilitates low-latency, real-time synchronization of notebook content and user presence across distributed client sessions. 

A core differentiator of SyncNoteNet is its sophisticated role-based access control (RBAC) model. Each document, treated as a "notebook," supports owner, collaborator, and guest-level interactions. The platform enables secure, URL-based sharing with optional password protection, ensuring granular control over document visibility and modification rights. Key features include an auto-save mechanism, live presence indicators, dual-editor metadata management, and a threaded commenting system.

This report comprehensively documents the lifecycle of the SyncNoteNet project, including problem formulation, system analysis, architectural design, implementation strategies, testing methodologies, and deployment patterns. Furthermore, it outlines a strategic future roadmap, detailing potential migration pathways to SvelteKit for enhanced frontend performance and the adoption of Conflict-free Replicated Data Types (CRDTs) to augment real-time collaboration reliability.

---

## LIST OF FIGURES

| Figure No | Figure Description |
| :--- | :--- |
| 1.1 | SyncNoteNet Context Diagram |
| 3.1 | Overall System Architecture |
| 3.2 | Use Case Diagram |
| 3.3 | Notebook Access Control Flow |
| 3.4 | Real-time Collaboration Sequence Diagram |
| 3.5 | Database Entity Relationship Conceptual Map |
| 4.1 | Deployment Architecture (Docker/Kubernetes) |

---

## LIST OF TABLES

| Table No | Table Description |
| :--- | :--- |
| 2.1 | Technology Stack Summary |
| 2.2 | Functional Requirement Matrix |
| 2.3 | Non-Functional Requirement Matrix |
| 2.4 | Software and Hardware Requirements |
| 3.1 | API Route Summary |
| 3.2 | Role and Permission Matrix |
| 4.1 | Test Case Summary |
| 5.1 | Future Enhancement Roadmap |

---

## TABLE OF CONTENTS

1. **Chapter 1: INTRODUCTION**
   - 1.1 Domain Background
   - 1.2 Motivation
   - 1.3 Problem Statement
   - 1.4 Objectives
   - 1.5 Scope of the Current Version
   - 1.6 Project Stakeholders
   - 1.7 Project Scheduling
2. **Chapter 2: SYSTEM ANALYSIS**
   - 2.1 Existing Solution Analysis
   - 2.2 Gap Analysis
   - 2.3 Requirement Analysis
   - 2.4 Constraints and Assumptions
   - 2.5 Dependencies and Risks
3. **Chapter 3: SYSTEM DESIGN**
   - 3.1 Architecture Overview
   - 3.2 Module Decomposition
   - 3.3 Use Case Modeling
   - 3.4 Sequence Flows and State Transitions
   - 3.5 Database Design
   - 3.6 Access Control Model
   - 3.7 API Contract Summary
4. **Chapter 4: IMPLEMENTATION**
   - 4.1 Frontend Implementation Details
   - 4.2 Backend Implementation Details
   - 4.3 Real-time Implementation Details
   - 4.4 Security Implementation Details
   - 4.5 Testing Strategy
   - 4.6 Deployment Implementation
5. **Chapter 5: CONCLUSION AND FUTURE ENHANCEMENT**
   - 5.1 Conclusion and Deliverables
   - 5.2 Limitations and Bottlenecks
   - 5.3 Future Modernization Focus: SvelteKit
   - 5.4 Strategic Collaboration Upgrade: CRDTs
   - 5.5 Feature Audit: Keep, Enhance, Simplify, Add
6. **APPENDICES**
7. **REFERENCES**
8. **VIVA PREPARATION NOTES**

---

# CHAPTER 1: INTRODUCTION

## 1.1 Domain Background
The landscape of productivity software has increasingly shifted towards cloud-based, collaborative platforms. Tools that enable multiple users to interact with shared data in real-time have become industry standards. However, a distinct schism remains in the market between rich-text documentation tools (e.g., Google Docs, Notion) and code-centric collaborative environments (e.g., Replit, CoderPad). While each excels in its specific domain, hybrid workflows combining extensive textual explanations with executable or formatted code snippets remain fragmented.

## 1.2 Motivation
Modern software development, academic research, and technical education require cohesive environments. Users frequently need to write comprehensive documentation, project notes, or tutorial steps alongside complex code segments. Currently, teams are forced to maintain parallel systems—one for project documentation and another for code sharing. This separation causes context switching, reduces collaboration efficiency, and often leads to desynchronized information. SyncNoteNet is motivated by the necessity to bridge this gap, offering a unified platform tailored for technical workflows.

## 1.3 Problem Statement
The fragmentation of documentation and code editing tools hinders collaborative efficiency. Existing platforms either lack robust code formatting and syntax highlighting or are too heavily focused on code execution to serve as effective general-purpose note-taking applications. Furthermore, sharing sensitive technical notes often lacks granular access control, relying on insecure public links or rigid, organization-wide permissions. SyncNoteNet addresses these issues by providing a unified, real-time collaborative workspace that supports both rich text and code editing, backed by a flexible, role-based access control system and secure sharing mechanisms.

## 1.4 Objectives
The primary objectives of the SyncNoteNet project are:
1. To develop a platform where rich text and code editing coexist seamlessly within the same "notebook" entity.
2. To implement low-latency, real-time synchronization allowing multiple users to edit content concurrently.
3. To establish a robust security model featuring role-based access (Owner, Collaborator, Guest) and optional password protection for document sharing.
4. To provide an intuitive, responsive user interface that supports auto-saving, live presence indication, and seamless switching between editor modes.
5. To design a scalable, deployment-ready backend architecture capable of supporting future enhancements like CRDTs and horizontally scaled web sockets.

## 1.5 Scope of the Current Version
The current implementation of SyncNoteNet encompasses:
- Complete user lifecycle management (Registration, Authentication, Profile Management).
- Comprehensive CRUD (Create, Read, Update, Delete) operations for notebooks.
- Dual-editor capabilities: Rich text editing via Quill and code editing via Monaco.
- Real-time collaborative synchronization utilizing Socket.IO.
- Advanced sharing mechanisms: URL-based access, password protection, and collaborator assignments.
- Threaded commenting systems for asynchronous collaboration.
- Search, filtering, and pagination for notebook discovery.

*Out of Scope:* Fully automated offline-first synchronization, built-in code execution/compilation environments, and comprehensive enterprise audit logging are deferred to future iterations.

## 1.6 Project Stakeholders
- **Students & Educators:** Utilizing the platform for assignments, collaborative study notes, and programming tutorials.
- **Software Developers & Engineering Teams:** Leveraging the tool for technical design documents, code reviews, and pair programming exercises.
- **Project Maintainers:** Ensuring the long-term stability and security of the application.
- **DevOps Administrators:** Managing the deployment pipelines across local, containerized, and cloud-native (Kubernetes) environments.

## 1.7 Project Scheduling
The project was executed through a structured, phased approach:
- **Phase 1 (1-2 Weeks):** Requirement analysis, architecture design, and technology stack finalization.
- **Phase 2 (2 Weeks):** Backend API foundation, database schema design, and core authentication mechanisms.
- **Phase 3 (2-3 Weeks):** Frontend layout development, component design, and integration of notebook CRUD operations.
- **Phase 4 (2 Weeks):** Integration of Socket.IO for real-time presence and collaborative editing; implementation of Quill and Monaco editors.
- **Phase 5 (1-2 Weeks):** Finalization of access control logic, password-protected sharing flows, and role validation.
- **Phase 6 (1-2 Weeks):** End-to-end testing, Docker/Kubernetes configuration, and comprehensive documentation generation.

---

# CHAPTER 2: SYSTEM ANALYSIS

## 2.1 Existing Solution Analysis
Current market solutions generally fall into two categories:
1. **Document-Centric (e.g., Notion, Google Docs):** Excellent for rich text, tables, and media, but offer rudimentary or static code blocks without advanced syntax highlighting, linting, or intelligent auto-completion.
2. **Code-Centric (e.g., VS Code Live Share, CodePen):** Highly optimized for writing and executing code but are cumbersome for writing extensive, formatted documentation or unstructured meeting notes.

## 2.2 Gap Analysis
SyncNoteNet identifies and bridges the following critical gaps:
- **The Hybrid Gap:** Lack of a single, lightweight web interface that transitions smoothly between a high-quality document editor and an IDE-grade code editor.
- **The Access Control Gap:** Many lightweight sharing tools lack the nuance between a completely public link and a strictly private document. SyncNoteNet introduces a middle ground with URL identifiers combined with role-based policies and password verification.
- **The Collaboration Continuity Gap:** Providing real-time synchronized editing alongside asynchronous threaded comments, enabling both synchronous pair-programming and asynchronous code reviews.

## 2.3 Requirement Analysis

### 2.3.1 Functional Requirements
- **FR-1 (Authentication):** The system shall authenticate users via secure email/password registration and login, issuing JWTs for session management.
- **FR-2 (Notebook Lifecycle):** Users shall be able to create, read, update, and delete their notebooks.
- **FR-3 (Dual Editors):** The system shall support rich text formatting (Quill mode) and advanced code editing (Monaco mode) dynamically based on notebook metadata.
- **FR-4 (Real-time Collaboration):** Multiple authenticated users (or guests) shall be able to join a notebook room, see live presence, and view edits in real-time.
- **FR-5 (Access Control):** Notebooks must enforce privacy settings (Everyone, Private, Collaborators) and optionally require password verification for access.
- **FR-6 (Sharing):** Owners shall be able to generate shareable URLs and grant specific 'read' or 'write' access to registered collaborators.
- **FR-7 (Commenting):** Users shall be able to append threaded comments to notebooks for discussion.

### 2.3.2 Non-Functional Requirements
- **NFR-1 (Performance & Latency):** WebSocket communication must handle real-time keystroke propagation with sub-second latency under normal network conditions.
- **NFR-2 (Security):** APIs must be protected against common web vulnerabilities (XSS, CSRF, NoSQL Injection) using middleware like Helmet and rate-limiting. Passwords must be hashed using bcrypt.
- **NFR-3 (Scalability):** The backend must be container-ready, with architecture supporting a Redis adapter for horizontally scaling Socket.IO across multiple Node.js instances.
- **NFR-4 (Usability):** The frontend interface must be intuitive, providing clear visual indicators for user presence, auto-save status, and connection health.

### 2.3.3 Software and Hardware Requirements
- **Client Side:** Modern web browser (Chrome, Edge, Firefox, Safari) with JavaScript enabled.
- **Server Side Runtime:** Node.js (v18 or v20).
- **Database:** MongoDB (local instance or MongoDB Atlas).
- **Development Tools:** Git, Docker, Docker Compose, npm/yarn.

## 2.4 Constraints and Assumptions
- **Assumptions:** Users have a stable internet connection to maintain WebSocket connectivity. Users understand the implications of setting a notebook to "Everyone".
- **Constraints:** Heavy frontend editor libraries (Monaco) may impact performance on extremely low-end client devices. Real-time synchronization relies on continuous server connectivity; offline-first conflict resolution is not fully supported in this iteration.

## 2.5 Dependencies and Risks
- **Data Race Risk:** Concurrent edits by multiple users on the exact same line might cause brief state conflicts. *Mitigation:* Implementing operational transformation or strict event sequencing over sockets; future roadmap includes CRDTs.
- **Security Misconfiguration:** Improper sharing of URL identifiers. *Mitigation:* Clear UI warnings, default-to-private settings, and optional password layers.
- **Dependency Drift:** Rapid updates to React or Socket.IO ecosystems. *Mitigation:* Pinning dependency versions in `package.json` and comprehensive integration testing.

---

# CHAPTER 3: SYSTEM DESIGN

## 3.1 Architecture Overview
SyncNoteNet employs a decoupled, client-server architecture designed for high cohesion and loose coupling.
- **Presentation Layer (Frontend):** A Single Page Application (SPA) built with React 18, utilizing React Router for navigation and Material UI for consistent styling. It manages local application state, handles complex editor instances, and maintains WebSocket connections.
- **Application Layer (Backend):** An Express.js REST API serving as the central orchestration engine. It validates business logic, manages authentication, and hosts the Socket.IO server for real-time telemetry.
- **Data Access Layer:** Mongoose ODM is utilized to interact with the MongoDB database, enforcing schemas and data relationships.

## 3.2 Module Decomposition
The system is divided into functional modules:
1. **Authentication Module:** Manages registration, JWT issuance, profile updates, and password hashing.
2. **Notebook Module:** Handles CRUD operations, search indexing, and tagging for notebooks.
3. **Editor Engine Module:** A frontend abstraction that conditionally renders either the Quill or Monaco editor based on the notebook's configuration, mapping state changes to unified API payloads.
4. **Access Control Module:** A critical backend middleware and service layer that intercepts requests to evaluate if the requesting user (based on JWT) has the required role (Owner, Collaborator, Guest) to access or modify a requested resource.
5. **Real-time Collaboration Module:** Manages Socket.IO rooms. When a user opens a notebook, they join a specific room. This module broadcasts presence (join/leave) and granular content updates.
6. **Commenting Module:** Manages a separate data collection for threaded discussions linked to specific notebooks.

## 3.3 Use Case Modeling
- **Actor: System User (Owner)**
  - Can create notebooks, edit content, delete notebooks.
  - Can change permissions, add collaborators, set passwords.
- **Actor: Collaborator**
  - Can access specific notebooks shared with them.
  - Can edit content (if granted write access).
- **Actor: Guest / Anonymous User**
  - Can access public notebooks via URL.
  - Must pass a password challenge if the public notebook is protected.
  - Can read or contribute to comments depending on configuration.

## 3.4 Sequence Flows and State Transitions

### Notebook Access Sequence
1. Client requests a notebook via `/n/:urlIdentifier`.
2. Backend retrieves notebook metadata.
3. Access Control Engine evaluates:
   - Is it private? (Check if User ID == Owner ID).
   - Is it collaborator-only? (Check if User ID is in collaborators array).
   - Is there a password? (If yes, halt and return `403 Password Required` state).
4. Upon validation, the notebook payload is returned.
5. Client initializes the Editor Engine and establishes a WebSocket connection to the notebook's unique room ID.

### Real-time Edit Sequence
1. User types in Monaco/Quill.
2. Frontend throttles the keystroke and emits a `notebookUpdated` socket event containing the delta/content.
3. Server receives the event, validates the session, and broadcasts `notebookUpdated` to all other clients in the room.
4. Concurrently, an auto-save timer triggers a REST `PUT` request to persist the latest state to MongoDB.

## 3.5 Database Design
The application relies on a NoSQL document structure tailored for flexibility.

**Notebook Collection:**
- `_id`: ObjectId
- `title`: String
- `content`: String
- `creatorID`: ObjectId (Ref: User)
- `permissions`: Enum ['everyone', 'private', 'collaborators']
- `password`: String (Hashed, optional)
- `collaborators`: Array of Objects `{ userId, access: ['read', 'write'] }`
- `editorMode`: Enum ['quill', 'monaco']
- `language`: String (e.g., 'javascript', 'python')
- `urlIdentifier`: String (Unique index)
- `tags`: Array of Strings
- `timestamps`: createdAt, updatedAt

**User Collection:**
- `_id`: ObjectId
- `name`: String
- `email`: String (Unique)
- `password`: String (Hashed)
- `role`: String

**Comment Collection:**
- `_id`: ObjectId
- `notebookId`: ObjectId (Ref: Notebook)
- `author`: ObjectId (Ref: User, optional)
- `guestAuthor`: String (optional)
- `content`: String
- `parentId`: ObjectId (Ref: Comment, for nested replies)

## 3.6 Access Control Model
SyncNoteNet implements a sophisticated matrix for authorization:
- **Owner:** Full lifecycle control. Can bypass password prompts if authenticated.
- **Collaborator (Write):** Can view and edit the document. Cannot delete or change sharing settings.
- **Collaborator (Read):** Can view the document only.
- **Public (Everyone):** Can view. If a password is set, they must provide it via a dedicated endpoint to receive a temporary access grant.

## 3.7 API Contract Summary
- `POST /api/users/register`: Registers a new user.
- `POST /api/users/login`: Authenticates and returns a JWT.
- `GET /api/notebooks/:urlIdentifier`: Fetches a notebook based on URL parameters and access rights.
- `POST /api/notebooks/:id/verify-password`: Exchanges a valid notebook password for access.
- `PUT /api/notebooks/:id`: Updates notebook content/metadata (protected by ownership/collaborator checks).
- `POST /api/notebooks/:id/share`: Updates the collaborator array.

---

# CHAPTER 4: IMPLEMENTATION

## 4.1 Frontend Implementation Details
The React frontend is architected for high performance and maintainability.
- **State Management:** React Context API is utilized for global states such as AuthContext and ThemeContext. Local component state manages highly volatile data like editor keystrokes.
- **Editor Integration:** `@monaco-editor/react` is wrapped in an `EnhancedEditor` component to handle lifecycle and dynamic language switching. `react-quill` is used for rich text. A unified wrapper component dictates which editor to mount based on the `editorMode` prop.
- **Auto-Save:** Implemented using a custom debounced hook. When a user stops typing for a configured interval, a background API call persists the data, and an `AutoSaveIndicator` component transitions from "Unsaved Changes" to "Saved".
- **Real-time Presence:** A `PresenceContext` manages a list of active users provided by Socket.IO, rendering avatars or names in the UI header.

## 4.2 Backend Implementation Details
The Node.js/Express backend prioritizes security and asynchronous performance.
- **Middleware Pipeline:** Incoming requests pass through `helmet()` for header security, a custom rate limiter, and a JWT verification middleware (`verifyToken.js`) that attaches user context to the request object.
- **Route Logic:** Routes are modularized (e.g., `notebookRoutes.js`, `userRoutes.js`). Controller functions encapsulate the business logic, heavily relying on Mongoose methods (`findById`, `findOneAndUpdate`).
- **Error Handling:** A centralized `errorHandler.js` catches unhandled promise rejections, formats error responses uniformly, and logs stack traces to `error.log` using Winston.

## 4.3 Real-time Implementation Details
Socket.IO is configured to work alongside the Express HTTP server.
- **Connection & Authentication:** Upon connection, the socket client passes an auth payload. The server validates the token to associate the socket ID with a User ID.
- **Room Dynamics:** Users emit a `joinNotebook` event with the notebook ID. The server adds the socket to a room specifically for that notebook and broadcasts a `joinedNotebook` event updating the presence list.
- **Event Propagation:** Edits trigger `notebookUpdated` events. To prevent echo loops, the server uses `socket.to(roomId).emit(...)` which sends the data to everyone in the room *except* the sender.

## 4.4 Security Implementation Details
Security is applied across multiple layers:
- **Data at Rest:** Passwords (both user accounts and notebook protections) are hashed using `bcrypt` with a high salt round before database insertion.
- **Data in Transit:** JWTs are used for stateful validation without storing session IDs. All API interactions are designed to operate over HTTPS in production.
- **Application Level:** Express Mongo Sanitize and XSS-clean middlewares prevent injection attacks. The Access Control engine strictly validates the `creatorID` or `collaborators` array against the `req.user.id` on every protected route.

## 4.5 Testing Strategy
To ensure reliability, SyncNoteNet employs a multi-tiered testing strategy:
- **Unit Testing:** Backend utility functions (like token generation and validation logic) are tested independently.
- **API Integration Testing:** Scripts (e.g., `test-backend-integration.js`, `test-guest-flow.js`) utilize standard HTTP clients to simulate end-to-end API flows, ensuring access control matrices hold firm (e.g., verifying a guest cannot delete a private notebook).
- **Manual UI Validation:** Verification of edge cases such as token expiration handling, password prompt rendering, and concurrent editing visual feedback.

## 4.6 Deployment Implementation
The application is designed to be cloud-native and environment-agnostic.
- **Local Development:** Configured via `package.json` scripts (`npm run dev`) utilizing `nodemon` for the backend and `react-scripts` for the frontend.
- **Containerization:** Separate `Dockerfile`s exist for the API and Frontend. A `docker-compose.yml` orchestrates the Node server, React static server (Nginx), and a MongoDB container for isolated, reproducible environments.
- **Kubernetes (K8s):** Production-ready manifests (`deployment.yml`, `service.yml`, `ingress.yml`) are provided in the `/k8s` directory, detailing namespaces, secrets management, and load-balancing configurations for scalable deployment on clusters like AWS EKS or local Minikube.

---

# CHAPTER 5: CONCLUSION AND FUTURE ENHANCEMENT

## 5.1 Conclusion and Deliverables
SyncNoteNet successfully achieves its primary objective: providing a cohesive, real-time workspace that bridges the gap between rich text documentation and specialized code editing. By integrating Quill and Monaco editors under a unified notebook entity, the platform significantly reduces context switching for technical users. The implementation of robust role-based access control, URL-based sharing, and real-time Socket.IO synchronization proves that a complex, collaborative system can be built maintainably using a modern JavaScript stack.

## 5.2 Limitations and Bottlenecks
While fully functional, the current architecture has identified limitations:
- **Concurrent Editing Conflicts:** Heavy simultaneous editing on the exact same line of code relies on "last-write-wins" via socket broadcasts, which can occasionally cause visual jitter or minor data overwrites.
- **Resource Intensity:** Mounting the Monaco editor is computationally heavy. Multiple large code notebooks open simultaneously on low-end devices can cause frontend performance degradation.
- **Vertical Socket Scaling:** The current Socket.IO implementation relies on single-server memory for room tracking. Scaling horizontally requires the integration of a Redis adapter.

## 5.3 Future Modernization Focus: SvelteKit
A major component of the future roadmap is a strategic migration of the frontend from React to SvelteKit.
**Rationale:** SvelteKit compiles components to highly efficient imperative code that directly updates the DOM, bypassing the virtual DOM overhead inherent in React. This is particularly critical for collaborative applications where real-time socket events cause rapid, high-frequency state updates.
**Migration Plan:**
1. **Phase 1 (Foundation):** Establish the SvelteKit shell, routing logic, and migrate the authentication flows.
2. **Phase 2 (Dashboard & API):** Port the notebook listing pages utilizing SvelteKit's native server-side loading mechanisms for improved SEO and initial load times.
3. **Phase 3 (Editor Integration):** Carefully wrap Monaco and Quill equivalents within Svelte components, ensuring lifecycle hooks correctly manage socket connections.

## 5.4 Strategic Collaboration Upgrade: CRDTs
To definitively resolve concurrent editing conflicts (Limitation 5.2), the collaboration engine will be upgraded from basic WebSocket broadcasting to a Conflict-free Replicated Data Type (CRDT) architecture, likely utilizing the `Yjs` framework.
**Rationale:** CRDTs mathematically guarantee that all clients will eventually converge on the exact same document state, regardless of the order in which edits arrive. This eliminates merge conflicts, provides offline-editing capabilities (syncing upon reconnection), and offers a vastly superior user experience for high-concurrency pair programming.

## 5.5 Feature Audit: Keep, Enhance, Simplify, Add

**Keep (Core Value Preserved):**
- Dual editor model (Rich Text + Code).
- Granular URL sharing and password protection flows.
- Real-time user presence indicators.

**Enhance (High Impact Refinements):**
- **Version History:** Implement a robust UI for tracking changes over time and rolling back to previous notebook states.
- **Collaborator Management:** Improve the UX for inviting users and adjusting permissions dynamically.

**Simplify (Reducing Friction):**
- Simplify the guest-access flow to rely primarily on secure, expiring links rather than requiring strict guest-account registration in low-security contexts.

**Add (Roadmap Expansion):**
- **Export Pipelines:** Add capabilities to export notebooks as PDF, standard Markdown, or JSON.
- **Workspaces:** Implement team-level groupings where notebooks inherit organization-wide access policies.
- **Due Dates & Reminders:** Integrate task management features directly into documentation notebooks.

---

# APPENDICES

## Appendix A - Key Environment Variables

**Backend (`api/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/syncnotenet
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=30d
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

**Frontend (`pro/.env`):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Appendix B - Sample API Payloads

**B.1 Register User Request**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123!"
}
```

**B.2 Create Notebook Request**
```json
{
  "title": "System Architecture Setup",
  "content": "Initial notes on Docker configuration...",
  "editorMode": "quill",
  "permissions": "collaborators"
}
```

**B.3 Verify Notebook Password Response**
```json
{
  "success": true,
  "accessLevel": "read",
  "userRole": "guest",
  "token": "temporary_access_token_xyz"
}
```

---

# REFERENCES
1. React Documentation: https://reactjs.org/docs/getting-started.html
2. Express.js API Reference: https://expressjs.com/en/4x/api.html
3. MongoDB/Mongoose Documentation: https://mongoosejs.com/docs/guide.html
4. Socket.IO Real-time Engine: https://socket.io/docs/v4/
5. Monaco Editor API: https://microsoft.github.io/monaco-editor/
6. Quill Rich Text Editor: https://quilljs.com/
7. JSON Web Tokens (JWT) RFC 7519: https://tools.ietf.org/html/rfc7519
8. OWASP Top Ten Security Risks: https://owasp.org/www-project-top-ten/

---

# VIVA PREPARATION NOTES

**Q1: Why did you choose a dual editor support system instead of standardizing on a single editor like Markdown?**
*Answer:* While Markdown is versatile, it lacks the intuitive WYSIWYG experience necessary for non-technical documentation and lacks the advanced IDE features (like deep syntax highlighting, linting, and auto-complete) required for serious coding. Providing both Quill and Monaco allows users to choose the optimal tool for the specific task within the same unified platform, completely eliminating context switching.

**Q2: How does your role-based access differ from simple password protection?**
*Answer:* Password protection is a blunt instrument—anyone with the password has the same access. Our role-based access control (RBAC) identifies the specific user (Owner, Collaborator, Guest) via their JWT session. This allows us to grant a user 'Read-Only' access while granting another 'Write' access, regardless of whether a password is required to access the public link.

**Q3: How is real-time synchronization managed in your architecture, and what happens if two users type at the exact same time?**
*Answer:* Synchronization is managed via Socket.IO. When a user opens a notebook, they join a specific Socket 'room'. Keystrokes are emitted as events to the server, which broadcasts them to all other clients in that room. Currently, it operates on a "last-write-wins" basic event model. If two users type on the exact same character simultaneously, minor overwrites can occur. This is a known limitation that we plan to address by migrating to a CRDT (Conflict-free Replicated Data Type) model using Yjs in the future.

**Q4: What are the current scalability limitations of the platform?**
*Answer:* The primary limitation is stateful WebSocket connections. Currently, Socket.IO tracks active rooms in the memory of the single Node.js process. To scale horizontally across multiple servers, we would need to implement a Redis Pub/Sub adapter to route socket events across different Node instances. Additionally, heavy reliance on the Monaco editor can cause client-side memory bloat if a user opens many large code notebooks simultaneously.

**Q5: Why is SvelteKit considered as a future migration direction? Why not stick with React?**
*Answer:* React is powerful, but its Virtual DOM reconciliation process adds CPU overhead during rapid, high-frequency updates—which are common in real-time collaborative editors. SvelteKit compiles away the framework, producing highly optimized vanilla JavaScript that updates the DOM directly. This reduces client-side runtime overhead, resulting in a snappier, more responsive editor experience, especially on lower-end devices under heavy collaboration load. It is a strategic enhancement for performance, not a repudiation of React's current capability.
