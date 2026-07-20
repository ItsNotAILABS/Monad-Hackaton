import { createRoot } from 'react-dom/client';

import App from './App';
import { installRuntimeOrigin } from './lib/runtimeOrigin';

import './index.css';

installRuntimeOrigin();
createRoot(document.getElementById('root')!).render(<App />);
