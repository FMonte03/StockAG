import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import ScreenerView from './ScreenerView.jsx';
import StockDetail from './StockDetail.jsx';

const App = () => {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo-section" onClick={() => navigate('/')}>

          <h1 className="logo-title">StockAg <span className="logo-highlight">Screener</span></h1>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<ScreenerView />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;