import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import styles from './Shell.module.css';

interface ShellProps {
  children: ReactNode;
}

export default function Shell({ children }: ShellProps) {
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
