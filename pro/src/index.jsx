import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import ModernLandingPage from './LandingPage/ModernLandingPage';
import NotebookEditor from './NotebookEditorPage/NotebookEditorPage';
import EnhancedNotebookCreator from './NotebookEditorPage/EnhancedNotebookCreator';
import EnhancedNotebookEditor from './NotebookEditorPage/EnhancedNotebookEditor';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ModernSignInPage from './SigninSignup/ModernSignInPage';
import NotebooksPage from './NotebooksPage/NotebooksPage';
import SharedNotebooksPage from './SharedNotebooksPage/SharedNotebooksPage';
import CollapsibleModernLayout from './Components/CollapsibleModernLayout';
import ProfilePage from './Profile/ProfilePage';
import ThemeProvider from './contexts/ThemeContext';
import ErrorBoundary from './Components/ErrorBoundary';
import ProtectedRoute from './Components/ProtectedRoute';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <Router>
        <Routes>
          <Route element={<CollapsibleModernLayout />}>
            <Route index element={<ModernLandingPage />} />
            <Route path='/Notebook/new' element={
              <ProtectedRoute requireAuth={true}>
                <NotebookEditor />
              </ProtectedRoute>
            } />
            <Route path='/Notebook/create' element={
              <ProtectedRoute requireAuth={true}>
                <EnhancedNotebookCreator />
              </ProtectedRoute>
            } />
            <Route path='/Notebook/:urlIdentifier' element={<NotebookEditor />} />
            <Route path='/Notebook/:urlIdentifier/enhanced' element={<EnhancedNotebookEditor />} />
            <Route path='/auth' element={<ModernSignInPage />} />
            <Route path='/signin' element={<ModernSignInPage />} />
            <Route path='/SigninSignup' element={<ModernSignInPage />} />
            <Route path='/notebooks' element={
              <ProtectedRoute >
                <NotebooksPage />
              </ProtectedRoute>
            } />
            <Route path='/shared' element={
              <ProtectedRoute requireAuth={true}>
                <SharedNotebooksPage />
              </ProtectedRoute>
            } />
            <Route path='/profile' element={
              <ProtectedRoute requireAuth={true}>
                <ProfilePage />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  </ErrorBoundary>
);
reportWebVitals();
