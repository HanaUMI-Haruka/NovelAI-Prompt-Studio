import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import './themes.css';
import './backup-history.css';
import './personal-tags.css';
import { applyAppearance, readAppearance } from './lib/appearance';

const initialAppearance = readAppearance();
applyAppearance(initialAppearance.theme);
createRoot(document.getElementById('root')!).render(<StrictMode><App initialAppearance={initialAppearance} /></StrictMode>);
