import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styles from './Shell.module.css';

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [pathname]);
  return (
    <div className={styles.shell}>
      <Header />
      <main id="main" className={styles.main}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
