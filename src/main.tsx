import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import AuthDebug from './pages/AuthDebug.tsx';
import Game from './pages/Game.tsx';
import Success from './pages/Success.tsx';
import Pricing from './pages/Pricing.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth-debug" element={<AuthDebug />} />
          <Route path="/game" element={<Game />} />
          <Route path="/success" element={<Success />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
