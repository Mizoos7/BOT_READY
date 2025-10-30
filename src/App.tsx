import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AppProvider } from './context/AppContext';
import HomePage from './pages/HomePage';
import './App.css';

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorBgBase: '#000000',
          colorBgContainer: '#111111',
          colorText: '#ffffff',
          colorTextSecondary: '#888888',
          borderRadius: 12,
        },
      }}
    >
      <AppProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<HomePage />} />
            </Routes>
          </div>
        </Router>
      </AppProvider>
    </ConfigProvider>
  );
};

export default App;
