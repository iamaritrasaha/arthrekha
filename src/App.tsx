import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import Shell from '@/components/layout/Shell';

const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const LearnPage = lazy(() => import('@/pages/LearnPage'));
const SourcesPage = lazy(() => import('@/pages/SourcesPage'));

function App() {
  return (
    <Shell>
      <Suspense fallback={<div role="status" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>Opening the fiscal atlas…</div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/sources" element={<SourcesPage />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}

export default App;
