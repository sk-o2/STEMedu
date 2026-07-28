import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <App />
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
                success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
              }}
            />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
