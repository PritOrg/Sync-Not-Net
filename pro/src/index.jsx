import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import LandingPage from "./LandingPage/LandingPage";
import NotebookEditor from "./NotebookEditorPage";
import PastelBackground from "./Components/PastelBackground";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthCallback from "./Components/AuthCallback";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <Router>
    <PastelBackground>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Notebook" element={<NotebookEditor />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </PastelBackground>
  </Router>
);
reportWebVitals();
