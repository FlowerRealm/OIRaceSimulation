import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import App from './App';
import './styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('#root is missing from index.html');

// The engine resolves every node it touches with getElementById at import time,
// so the skeleton has to be in the document before it loads. flushSync is the
// supported way to force a synchronous first paint when handing the DOM to
// non-React code; without it the engine would run against an empty #root.
flushSync(() => createRoot(container).render(<App />));

await import('./game/engine.js');
