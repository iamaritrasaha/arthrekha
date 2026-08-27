import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ArthrekhaMark from '@/components/brand/ArthrekhaMark';
import styles from './Header.module.css';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo} aria-label="Arthrekha home">
          <span className={styles.wordmark}><ArthrekhaMark size={25} className={styles.rupeeMark} /><span className={styles.logoText}>ARTHREKHA</span></span>
          <span className={styles.tagline}>India's public finances, made visible</span>
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          <a href="#reality-title" className={styles.navLink}>Explore</a>
          <a href="#method-title" className={styles.navLink}>Methodology</a>
          {/* Future navigation */}
          {/* <Link to="/india" className={styles.navLink}>Union Budget</Link> */}
          {/* <Link to="/learn" className={styles.navLink}>Learn</Link> */}
          {/* <Link to="/sources" className={styles.navLink}>Sources</Link> */}
        </nav>
      </div>
    </header>
  );
}
