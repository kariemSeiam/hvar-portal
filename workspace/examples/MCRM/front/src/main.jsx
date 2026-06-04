import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        // Service worker registration logging removed for production
      })
      .catch((registrationError) => {
        // Service worker registration error logging removed for production
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
