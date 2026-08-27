import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
          <NavLink to="/explore" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>Explore</NavLink>
          <NavLink to="/learn" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>Learn</NavLink>
          <NavLink to="/sources" className={({ isActive }) => `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}>Sources</NavLink>
        </nav>
      </div>
    </header>
  );
}
