import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

Object.keys(console).forEach((method) => {
  const original = (console as Record<string, unknown>)[method];
  if (typeof original === 'function') {
    (console as Record<string, unknown>)[method] = (...args: unknown[]) => {
      const msg = args.map((a) => String(a)).join(' ');
      if (
        msg.includes('postMessage') ||
        msg.includes('Failed to execute') ||
        msg.includes('Fallback font') ||
        msg.includes('Slow network')
      ) return;
      (original as (...args: unknown[]) => void).apply(console, args);
    };
  }
});

createRoot(document.getElementById("root")!).render(<App />);
