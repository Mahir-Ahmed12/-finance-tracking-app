import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with immediate caching
registerSW({
  immediate: true,
  onOfflineReady() {
    console.log('NEONVAULT is cached and ready to operate offline.');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
