import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Playground from './playground/Playground';
import './styles.css';

const Page = window.location.pathname.replace(/\/$/, '') === '/playground' ? Playground : App;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
