import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Session from './pages/Session';
import Documents from './pages/Documents';
import './styles/tokens.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Landing />} />
        <Route path="/session" element={<Session />} />
        <Route path="/documents" element={<Documents />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
