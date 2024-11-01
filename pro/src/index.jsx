import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import reportWebVitals from './reportWebVitals';
import LandingPage from './LandingPage/LandingPage';
import NotebookEditor from './NotebookEditorPage/NotebookEditorPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignInSignUpPage from './SigninSignup/SigninSignupPage';
import NotebooksPage from './NotebooksPage/NotebooksPage';
import Layout from './Components/Layout';
import ProfilePage from './Profile/ProfilePage';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path='/Notebook/:urlIdentifier' element={<NotebookEditor />} />
          <Route path='/SigninSignup' element={<SignInSignUpPage />} />
          <Route path='/notebooks' element={<NotebooksPage />} />
          <Route path='/profile' element={<ProfilePage />} />
        </Route>
      </Routes>
  </Router>
);
reportWebVitals();
