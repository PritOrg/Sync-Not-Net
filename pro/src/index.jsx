import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/notebook-editor.css';
import reportWebVitals from './reportWebVitals';
import ModernLandingPage from './LandingPage/ModernLandingPage';
import EnhancedNotebookEditor from './NotebookEditorPage/EnhancedNotebookEditor';
import EnhancedNotebookCreator from './NotebookEditorPage/EnhancedNotebookCreator';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ModernAuthPage from './SigninSignup/ModernAuthPage';
import NotebooksDashboard from './NotebooksPage/NotebooksDashboard';
import ProfilePage from './Profile/ProfilePage';
import ThemeProvider from './contexts/ThemeContext';
import ErrorBoundary from './Components/ErrorBoundary';
import ToastProvider from './Components/ToastProvider';
import SharedNotebooksPage from './SharedNotebooksPage/SharedNotebooksPage';
import PresenceProvider from './contexts/PresenceContext';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/auth?mode=login" replace />;
  }
  return children;
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <ErrorBoundary>
    <ThemeProvider>
      <ToastProvider>
        <PresenceProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route index element={<ModernLandingPage />} />
              <Route path="/auth" element={<ModernAuthPage />} />
              <Route path="/SigninSignup" element={<ModernAuthPage />} />
              
              {/* Protected routes */}
              <Route
                path="/notebooks"
                element={
                  <ProtectedRoute>
                    <NotebooksDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-notebook"
                element={
                  <ProtectedRoute>
                    <EnhancedNotebookEditor mode="new" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-enhanced"
                element={
                  <ProtectedRoute>
                    <EnhancedNotebookCreator />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Notebook/:urlIdentifier"
                element={<EnhancedNotebookEditor />}
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/shared"
                element={
                  <ProtectedRoute>
                    <SharedNotebooksPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </PresenceProvider>
      </ToastProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
reportWebVitals();