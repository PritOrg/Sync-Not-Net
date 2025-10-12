import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import ModernLandingPage from './LandingPage/ModernLandingPage';
import NotebookEditor from './NotebookEditorPage/NotebookEditorPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModernSignInPage from './SigninSignup/ModernSignInPage';
import NotebooksPage from './NotebooksPage/NotebooksPage';
import ModernLayout from './Components/CollapsibleModernLayout';
import ProfilePage from './Profile/ProfilePage';
import ThemeProvider from './contexts/ThemeContext';
import ErrorBoundary from './Components/ErrorBoundary';
import SharedNotebooksPage from './SharedNotebooksPage/SharedNotebooksPage';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route >
            <Route index element={<ModernLandingPage />} />
            <Route path='/Notebook/new' element={<NotebookEditor />} />
            <Route path='/Notebook/:urlIdentifier' element={<NotebookEditor />} />
            <Route path='/auth' element={<ModernSignInPage />} />
            <Route path='/SigninSignup' element={<ModernSignInPage />} />
            <Route path='/notebooks' element={<NotebooksPage />} />
            <Route path='/profile' element={<ProfilePage />} />
            <Route path='/shared' element={<SharedNotebooksPage />} />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  </ErrorBoundary>
);
reportWebVitals();
