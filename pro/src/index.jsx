import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import ModernLandingPage from './LandingPage/ModernLandingPage';
import NotebookEditor from './NotebookEditorPage/NotebookEditorPage';
import EnhancedNotebookCreator from './NotebookEditorPage/EnhancedNotebookCreator';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModernSignInPage from './SigninSignup/ModernSignInPage';
import NotebooksPage from './NotebooksPage/NotebooksPage';
import ProfilePage from './Profile/ProfilePage';
import ThemeProvider from './contexts/ThemeContext';
import ErrorBoundary from './Components/ErrorBoundary';
import SharedNotebooksPage from './SharedNotebooksPage/SharedNotebooksPage';
import PresenceProvider from './contexts/PresenceContext';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <PresenceProvider>
        <Router>
          <Routes>
            <Route >
              <Route index element={<ModernLandingPage />} />
              <Route path='/create-notebook' element={<NotebookEditor mode="new" />} />
              <Route path='/create-enhanced' element={<EnhancedNotebookCreator />} />
              <Route path='/Notebook/:urlIdentifier' element={<NotebookEditor />} />
              <Route path='/auth' element={<ModernSignInPage />} />
              <Route path='/SigninSignup' element={<ModernSignInPage />} />
              <Route path='/notebooks' element={<NotebooksPage />} />
              <Route path='/profile' element={<ProfilePage />} />
              <Route path='/shared' element={<SharedNotebooksPage />} />
            </Route>
          </Routes>
        </Router>
      </PresenceProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
reportWebVitals();
