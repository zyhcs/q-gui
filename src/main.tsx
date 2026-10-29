import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { MiniHud } from './components/MiniHud';
import './index.css';

// 检查是否是通过 ?window=hud 启动的小型查询面板
const urlParams = new URLSearchParams(window.location.search);
const isHud = urlParams.get('window') === 'hud';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {isHud ? <MiniHud /> : <App />}
  </React.StrictMode>
);
