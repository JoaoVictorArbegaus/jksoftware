import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// No build a página chega pré-renderizada e é hidratada; no `npm run dev` o root só tem o comentário
// <!--app-html--> (que conta em hasChildNodes) e o React monta do zero.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
