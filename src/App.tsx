import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import LandingPage from '@/pages/LandingPage';
import Shell from '@/components/layout/Shell';
import { useTranslation } from '@/i18n';

const ExplorePage = lazy(() => import('@/pages/ExplorePage'));
const LearnPage = lazy(() => import('@/pages/LearnPage'));
const SourcesPage = lazy(() => import('@/pages/SourcesPage'));

function App() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div role="status" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>{t('Opening the fiscal atlas…')}</div>}>
      <Routes>
        <Route path="/" element={<Shell><HomePage /></Shell>} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/insights" element={<Navigate to="/" replace />} />
        <Route path="/explore" element={<Shell><ExplorePage /></Shell>} />
        <Route path="/learn" element={<Shell><LearnPage /></Shell>} />
        <Route path="/sources" element={<Shell><SourcesPage /></Shell>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
