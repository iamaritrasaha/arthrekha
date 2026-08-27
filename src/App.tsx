import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import Shell from '@/components/layout/Shell';

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Future routes */}
        {/* <Route path="/india" element={<IndiaOverview />} /> */}
        {/* <Route path="/india/budget" element={<BudgetPage />} /> */}
        {/* <Route path="/sources" element={<SourcesPage />} /> */}
      </Routes>
    </Shell>
  );
}

export default App;
