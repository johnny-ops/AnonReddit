import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Feed from './pages/Feed';
import PostDetail from './pages/PostDetail';
import { Sparkles } from 'lucide-react';

function App() {
  return (
    <>
      <header className="header glass-panel container" style={{ marginTop: '1rem', borderRadius: '20px' }}>
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles className="logo-icon" />
          AnonReddit
        </Link>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Anonymous Community
        </div>
      </header>

      <main className="container" style={{ paddingTop: '0' }}>
        <Routes>
          <Route path="/" element={<Feed />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      </main>
    </>
  );
}

export default App;
