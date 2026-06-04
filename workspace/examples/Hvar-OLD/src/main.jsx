// main.jsx - Customer Management System
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Set up the document direction for RTL support
document.documentElement.dir = 'rtl';
document.documentElement.lang = 'ar';

// Set page title
document.title = 'نظام إدارة العملاء - HVAR';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);