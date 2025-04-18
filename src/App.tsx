// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BusinessListPage from './pages/BusinessPage';
import ArticleListPage from './pages/ArticlePage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BusinessListPage />} />
        <Route path="/articles/:businessId" element={<ArticleListPage />} />
      </Routes>
    </Router>
  );
}

export default App;