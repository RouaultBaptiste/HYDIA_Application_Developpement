import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/hooks/use-theme'

// Configure API URL for development
if (!import.meta.env.VITE_API_URL) {
  // Use a safer approach with a global variable
  (window as any).__HYDIA_API_URL__ = 'http://localhost:3001/api/v1';
  console.log('API URL set to:', (window as any).__HYDIA_API_URL__);
}

// Configure frontend URL for development
(window as any).__HYDIA_FRONTEND_URL__ = 'http://localhost:8081';

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="hydia-theme">
    <App />
  </ThemeProvider>
);
