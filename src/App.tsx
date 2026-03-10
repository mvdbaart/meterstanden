import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Settings } from './pages/Settings';
import { MeterEntry } from './pages/MeterEntry';
import { Dashboard } from './pages/Dashboard';
import { AIAnalysis } from './pages/AIAnalysis';
import { useAppContext } from './context/AppContext';

function RequireHousehold({ children }: { children: React.ReactNode }) {
  const { currentHousehold, isLoading } = useAppContext();

  if (isLoading) return null;
  if (!currentHousehold) {
    return <Navigate to="/settings" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<RequireHousehold><Dashboard /></RequireHousehold>} />
          <Route path="/entry" element={<RequireHousehold><MeterEntry /></RequireHousehold>} />
          <Route path="/analysis" element={<RequireHousehold><AIAnalysis /></RequireHousehold>} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;
